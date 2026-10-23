import {
  world,
  system,
  EntityComponentTypes,
  EntityDamageCause,
  EquipmentSlot,
} from "@minecraft/server";

// ---------------- Configuración ----------------
const STAFF_ID = "furia:rage_staff";
const RAGE_TAG = "furia_enraged";
const RAGE_SECONDS = 60; // cuánto dura la furia
const SEARCH_RADIUS = 16; // distancia a la que busca víctimas
const ATTACK_RANGE = 2.5; // distancia para poder golpear
const ATTACK_DAMAGE = 4; // daño por golpe (2 corazones)
const ATTACK_COOLDOWN_TICKS = 20; // 1 golpe por segundo
const CHASE_SPEED = 0.18; // fuerza del impulso al perseguir
const ATTACK_OWNER = false; // ¿puede atacar al jugador que lo enfureció?
const LOOP_TICKS = 4; // cada cuántos ticks se actualiza la IA

// Entidades que no cuentan como "seres vivos" aunque tengan vida.
const IGNORED_TYPES = new Set(["minecraft:armor_stand", "minecraft:item", "minecraft:xp_orb"]);

const DIMENSIONS = ["overworld", "nether", "the_end"];

// Estado en memoria (id de entidad -> datos)
const rageState = new Map();

function isHoldingStaff(player) {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const item = equippable?.getEquipment(EquipmentSlot.Mainhand);
  return item?.typeId === STAFF_ID;
}

function isAlive(entity) {
  if (!entity?.isValid()) return false;
  if (IGNORED_TYPES.has(entity.typeId)) return false;
  const health = entity.getComponent(EntityComponentTypes.Health);
  return health !== undefined && health.currentValue > 0;
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function enrage(mob, player) {
  mob.addTag(RAGE_TAG);
  mob.setDynamicProperty("furia:owner", player.id);
  rageState.set(mob.id, {
    ticksLeft: RAGE_SECONDS * 20,
    cooldown: 0,
    targetId: undefined,
  });

  const loc = mob.location;
  try {
    mob.dimension.playSound("mob.ravager.roar", loc);
  } catch {}
  for (let i = 0; i < 8; i++) {
    try {
      mob.dimension.spawnParticle("minecraft:villager_angry", {
        x: loc.x + (Math.random() - 0.5) * 1.2,
        y: loc.y + 1 + Math.random(),
        z: loc.z + (Math.random() - 0.5) * 1.2,
      });
    } catch {}
  }
  player.onScreenDisplay.setActionBar("§c¡El mob está furioso!");
}

function calmDown(mob) {
  rageState.delete(mob.id);
  if (!mob.isValid()) return;
  mob.removeTag(RAGE_TAG);
  mob.setDynamicProperty("furia:owner", undefined);
}

function findTarget(mob, state) {
  // Mantener el objetivo actual si sigue vivo y cerca.
  if (state.targetId) {
    const current = world.getEntity(state.targetId);
    if (
      isAlive(current) &&
      current.dimension.id === mob.dimension.id &&
      distanceSq(current.location, mob.location) <= SEARCH_RADIUS * SEARCH_RADIUS
    ) {
      return current;
    }
  }

  const ownerId = mob.getDynamicProperty("furia:owner");
  const candidates = mob.dimension.getEntities({
    location: mob.location,
    maxDistance: SEARCH_RADIUS,
  });

  let best;
  let bestDist = Infinity;
  for (const e of candidates) {
    if (e.id === mob.id || !isAlive(e)) continue;
    if (!ATTACK_OWNER && e.id === ownerId) continue;
    if (e.typeId === "minecraft:player") {
      const mode = e.getGameMode?.();
      if (mode === "creative" || mode === "spectator") continue;
    }
    const d = distanceSq(e.location, mob.location);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  state.targetId = best?.id;
  return best;
}

function updateMob(mob) {
  let state = rageState.get(mob.id);
  if (!state) {
    // El mundo se recargó: el mob conserva la etiqueta, le damos furia nueva.
    state = { ticksLeft: RAGE_SECONDS * 20, cooldown: 0, targetId: undefined };
    rageState.set(mob.id, state);
  }

  state.ticksLeft -= LOOP_TICKS;
  state.cooldown = Math.max(0, state.cooldown - LOOP_TICKS);
  if (state.ticksLeft <= 0 || !isAlive(mob)) {
    calmDown(mob);
    return;
  }

  // Partículas de enfado de vez en cuando.
  if (Math.random() < 0.25) {
    const l = mob.location;
    try {
      mob.dimension.spawnParticle("minecraft:villager_angry", { x: l.x, y: l.y + 2, z: l.z });
    } catch {}
  }

  const target = findTarget(mob, state);
  if (!target) return;

  const from = mob.location;
  const to = target.location;

  // Mirar al objetivo.
  try {
    mob.teleport(from, { facingLocation: to, keepVelocity: true });
  } catch {}

  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const horizontal = Math.sqrt(dx * dx + dz * dz);

  if (horizontal <= ATTACK_RANGE && Math.abs(to.y - from.y) < 2.5) {
    if (state.cooldown === 0) {
      target.applyDamage(ATTACK_DAMAGE, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: mob,
      });
      // Pequeño empujón a la víctima.
      if (target.typeId !== "minecraft:player" && horizontal > 0.01) {
        try {
          target.applyImpulse({ x: (dx / horizontal) * 0.4, y: 0.25, z: (dz / horizontal) * 0.4 });
        } catch {}
      }
      state.cooldown = ATTACK_COOLDOWN_TICKS;
    }
  } else if (horizontal > 0.01) {
    // Perseguir al objetivo.
    const jump = to.y - from.y > 0.6 && mob.isOnGround ? 0.42 : 0;
    try {
      mob.applyImpulse({
        x: (dx / horizontal) * CHASE_SPEED,
        y: jump,
        z: (dz / horizontal) * CHASE_SPEED,
      });
    } catch {}
  }
}

// Golpear a un mob con el bastón lo enfurece.
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
  if (damagingEntity?.typeId !== "minecraft:player") return;
  if (!hitEntity?.isValid() || hitEntity.typeId === "minecraft:player") return;
  if (!isAlive(hitEntity)) return;
  if (!isHoldingStaff(damagingEntity)) return;
  enrage(hitEntity, damagingEntity);
});

// Bucle de IA de los mobs furiosos.
system.runInterval(() => {
  for (const dimId of DIMENSIONS) {
    let mobs;
    try {
      mobs = world.getDimension(dimId).getEntities({ tags: [RAGE_TAG] });
    } catch {
      continue;
    }
    for (const mob of mobs) {
      try {
        updateMob(mob);
      } catch (err) {
        console.warn(`[Furia] ${err}`);
      }
    }
  }
}, LOOP_TICKS);
