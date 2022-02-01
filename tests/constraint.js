const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async () => loadAmmo());

test('constraint', (t) => {
  function testConstraint() {
    // init world
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      solver,
      collisionConfiguration
    );
    dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    // body 1
    const shape1 = new Ammo.btCapsuleShape(0.15, 0.2);
    const startTransform1 = new Ammo.btTransform();
    startTransform1.setIdentity();
    const mass1 = 1;
    const localInertia1 = new Ammo.btVector3(0, 0, 0);
    shape1.calculateLocalInertia(mass1, localInertia1);
    startTransform1.setOrigin(new Ammo.btVector3(-0.0, 1.0, 0.0));

    const myMotionState1 = new Ammo.btDefaultMotionState(startTransform1);
    const rbInfo1 = new Ammo.btRigidBodyConstructionInfo(
      mass1,
      myMotionState1,
      shape1,
      localInertia1
    );
    const body1 = new Ammo.btRigidBody(rbInfo1);
    dynamicsWorld.addRigidBody(body1);

    // body 2
    const shape2 = new Ammo.btCapsuleShape(0.07, 0.45);
    const startTransform2 = new Ammo.btTransform();
    startTransform2.setIdentity();
    const mass2 = 1;
    const localInertia2 = new Ammo.btVector3(0, 0, 0);
    shape2.calculateLocalInertia(mass2, localInertia2);

    startTransform2.setOrigin(new Ammo.btVector3(-0.18, 0.65, 0));

    const myMotionState2 = new Ammo.btDefaultMotionState(startTransform2);
    const rbInfo2 = new Ammo.btRigidBodyConstructionInfo(
      mass2,
      myMotionState2,
      shape2,
      localInertia2
    );
    const body2 = new Ammo.btRigidBody(rbInfo2);
    dynamicsWorld.addRigidBody(body2);

    // constraint
    const localA = new Ammo.btTransform();
    const localB = new Ammo.btTransform();
    localA.setIdentity();
    localB.setIdentity();
    localA.getBasis().setEulerZYX(0, 0, -Math.PI / 4);
    localA.setOrigin(new Ammo.btVector3(-0.18, -0.1, 0));
    localB.getBasis().setEulerZYX(0, 0, -Math.PI / 4);
    localB.setOrigin(new Ammo.btVector3(0, 0.22, 0));
    const coneC = new Ammo.btConeTwistConstraint(body1, body2, localA, localB);
    coneC.setLimit(Math.PI / 4, Math.PI / 4, 0);
    dynamicsWorld.addConstraint(coneC, true);

    function check(array) {
      array.forEach(function (value) {
        t.assert(!isNaN(value), 'NaN appeared!');
      });
    }

    // simulation
    const trans = new Ammo.btTransform(); // taking this out of the loop below us reduces the leaking
    for (let i = 0; i < 10; i++) {
      dynamicsWorld.stepSimulation(1 / 60, 10);
      if (body1.getMotionState()) {
        body1.getMotionState().getWorldTransform(trans);
        const vals = [
          trans.getOrigin().x().toFixed(2),
          trans.getOrigin().y().toFixed(2),
          trans.getOrigin().z().toFixed(2),
        ];
        check(vals);
        t.log(i + '/1 : ' + vals);
      }
      if (body2.getMotionState()) {
        body2.getMotionState().getWorldTransform(trans);
        const vals = [
          trans.getOrigin().x().toFixed(2),
          trans.getOrigin().y().toFixed(2),
          trans.getOrigin().z().toFixed(2),
        ];
        check(vals);
        t.log(i + '/2 : ' + vals);
      }
    }
  }

  testConstraint();
});
