const test = require('ava');
const getClosureMapping = require('./helpers/get-closure-mapping.js');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async () => loadAmmo());

test('stress', (t) => {
  const TEST_MEMORY = 0;

  let readMemoryCeiling, malloc;
  if (TEST_MEMORY) {
    (function () {
      try {
        STATICTOP;
        readMemoryCeiling = function () {
          return STATICTOP + _sbrk.DATASIZE;
        };
        malloc = _malloc;
      } catch (e) {
        const mapping = getClosureMapping();
        const key = '0';
        readMemoryCeiling = eval(
          '(function() { return ' +
            mapping['STATICTOP'] +
            ' + ' +
            mapping['_sbrk$DATASIZE'] +
            ' })'
        );
        malloc = eval(mapping['_malloc']);
      }
    })();
  }

  function benchmark() {
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

    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));

    const bodies = [];

    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -56, 0));

    (function () {
      const mass = 0;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      const myMotionState = new Ammo.btDefaultMotionState(groundTransform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        0,
        myMotionState,
        groundShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);
      bodies.push(body);
    })();

    const sphereShape = new Ammo.btSphereShape(1);
    const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
    const coneShape = new Ammo.btConeShape(1, 1); // XXX TODO: add cylindershape too

    [
      sphereShape,
      boxShape,
      coneShape,
      boxShape,
      sphereShape,
      coneShape,
    ].forEach(function (shape, i) {
      t.log('creating dynamic shape ' + i);

      const startTransform = new Ammo.btTransform();
      startTransform.setIdentity();
      const mass = 1;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);

      startTransform.setOrigin(
        new Ammo.btVector3(2 + i * 0.01, 10 + i * 2.1, 0)
      );

      const myMotionState = new Ammo.btDefaultMotionState(startTransform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        myMotionState,
        shape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);
      bodies.push(body);
    });

    let memoryStart;

    const trans = new Ammo.btTransform(); // taking this out of the loop below us reduces the leaking

    const startTime = Date.now();

    if (TEST_MEMORY) malloc(5 * 1024 * 1024); // stress memory usage

    const NUM = 150000;

    for (let i = 0; i < NUM; i++) {
      if (i === 250 && TEST_MEMORY) memoryStart = readMemoryCeiling();

      dynamicsWorld.stepSimulation(1 / 60, 10);

      bodies.forEach(function (body, j) {
        if (body.getMotionState()) {
          body.getMotionState().getWorldTransform(trans);
          if (i === NUM - 1)
            t.log(
              j +
                ' : ' +
                [
                  trans.getOrigin().x().toFixed(2),
                  trans.getOrigin().y().toFixed(2),
                  trans.getOrigin().z().toFixed(2),
                ]
            );
        }
      });
    }

    const endTime = Date.now();

    if (TEST_MEMORY)
      t.is(
        readMemoryCeiling(),
        memoryStart,
        'Memory ceiling must remain stable!'
      );

    t.log('total time: ' + ((endTime - startTime) / 1000).toFixed(3));
  }

  function testDestroy() {
    const NUM = 1000; // enough to force an increase in the memory ceiling
    let vec = new Ammo.btVector3(4, 5, 6);
    const memoryStart = readMemoryCeiling();
    for (let i = 0; i < NUM; i++) {
      Ammo.destroy(vec);
      vec = new Ammo.btVector3(4, 5, 6);
    }
    Ammo.destroy(vec);
    t.is(
      readMemoryCeiling(),
      memoryStart,
      'Memory ceiling must remain stable!'
    );
    for (let i = 0; i < NUM; i++) {
      vec = new Ammo.btVector3(4, 5, 6);
    }
    t.not(
      readMemoryCeiling(),
      memoryStart,
      'Memory ceiling must increase without destroy()!'
    );
  }

  benchmark();
  if (TEST_MEMORY) testDestroy();
  t.pass();
});
