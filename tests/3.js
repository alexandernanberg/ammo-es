const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async () => loadAmmo());

test("Issue 3: Ammo.btSweepAxis3 doesn't seem to work", (t) => {
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);

  // XXX interesting part
  const maxProxies = 16384;
  const aabbmin = new Ammo.btVector3(-1000, -1000, -1000); // world size
  const aabbmax = new Ammo.btVector3(1000, 1000, 1000);
  const overlappingPairCache = new Ammo.btAxisSweep3(
    aabbmin,
    aabbmax,
    maxProxies
  );
  // XXX interesting part

  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  const dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration
  );
  dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

  const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));

  const bodies = [];

  const groundTransform = new Ammo.btTransform();
  groundTransform.setIdentity();
  groundTransform.setOrigin(new Ammo.btVector3(0, -56, 0));

  (function () {
    const mass = 0;
    const isDynamic = mass !== 0;
    const localInertia = new Ammo.btVector3(0, 0, 0);

    if (isDynamic) groundShape.calculateLocalInertia(mass, localInertia);

    const myMotionState = new Ammo.btDefaultMotionState(groundTransform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      myMotionState,
      groundShape,
      localInertia
    );
    const body = new Ammo.btRigidBody(rbInfo);

    dynamicsWorld.addRigidBody(body);
    bodies.push(body);
  })();

  t.pass();
});
