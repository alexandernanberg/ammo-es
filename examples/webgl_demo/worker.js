const Module = { TOTAL_MEMORY: 512 * 1024 * 1024 };

importScripts('../../builds/ammo.js');

Ammo().then(function (Ammo) {
  let NUM = 0;
  const NUMRANGE = [];

  // Bullet-interfacing code

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

  const boxShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));

  function resetPositions() {
    const side = Math.ceil(Math.pow(NUM, 1 / 3));
    let i = 1;
    for (let x = 0; x < side; x++) {
      for (let y = 0; y < side; y++) {
        for (let z = 0; z < side; z++) {
          if (i == bodies.length) break;
          const body = bodies[i++];
          const origin = body.getWorldTransform().getOrigin();
          origin.setX((x - side / 2) * (2.2 + Math.random()));
          origin.setY(y * (3 + Math.random()));
          origin.setZ((z - side / 2) * (2.2 + Math.random()) - side - 3);
          body.activate();
          const rotation = body.getWorldTransform().getRotation();
          rotation.setX(1);
          rotation.setY(0);
          rotation.setZ(0);
          rotation.setW(1);
        }
      }
    }
  }

  function startUp() {
    NUMRANGE.forEach(function () {
      const startTransform = new Ammo.btTransform();
      startTransform.setIdentity();
      const mass = 1;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      boxShape.calculateLocalInertia(mass, localInertia);

      const myMotionState = new Ammo.btDefaultMotionState(startTransform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        myMotionState,
        boxShape,
        localInertia
      );
      const body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);
      bodies.push(body);
    });

    resetPositions();
  }

  const transform = new Ammo.btTransform(); // taking this out of readBulletObject reduces the leaking

  function readBulletObject(i, object) {
    const body = bodies[i];
    body.getMotionState().getWorldTransform(transform);
    const origin = transform.getOrigin();
    object[0] = origin.x();
    object[1] = origin.y();
    object[2] = origin.z();
    const rotation = transform.getRotation();
    object[3] = rotation.x();
    object[4] = rotation.y();
    object[5] = rotation.z();
    object[6] = rotation.w();
  }

  let nextTimeToRestart = 0;
  function timeToRestart() {
    // restart if at least one is inactive - the scene is starting to get boring
    if (nextTimeToRestart) {
      if (Date.now() >= nextTimeToRestart) {
        nextTimeToRestart = 0;
        return true;
      }
      return false;
    }
    for (let i = 1; i <= NUM; i++) {
      const body = bodies[i];
      if (!body.isActive()) {
        nextTimeToRestart = Date.now() + 1000; // add another second after first is inactive
        break;
      }
    }
    return false;
  }

  let meanDt = 0,
    meanDt2 = 0,
    frame = 1;

  function simulate(dt) {
    dt = dt || 1;

    dynamicsWorld.stepSimulation(dt, 2);

    let alpha;
    if (meanDt > 0) {
      alpha = Math.min(0.1, dt / 1000);
    } else {
      alpha = 0.1; // first run
    }
    meanDt = alpha * dt + (1 - alpha) * meanDt;

    const alpha2 = 1 / frame++;
    meanDt2 = alpha2 * dt + (1 - alpha2) * meanDt2;

    const data = {
      objects: [],
      currFPS: Math.round(1000 / meanDt),
      allFPS: Math.round(1000 / meanDt2),
    };

    // Read bullet data into JS objects
    for (let i = 0; i < NUM; i++) {
      const object = [];
      readBulletObject(i + 1, object);
      data.objects[i] = object;
    }

    postMessage(data);

    if (timeToRestart()) resetPositions();
  }

  let interval = null;

  onmessage = function (event) {
    NUM = event.data;
    NUMRANGE.length = 0;
    while (NUMRANGE.length < NUM) NUMRANGE.push(NUMRANGE.length + 1);

    frame = 1;
    meanDt = meanDt2 = 0;

    startUp();

    let last = Date.now();
    function mainLoop() {
      const now = Date.now();
      simulate(now - last);
      last = now;
    }
    if (interval) clearInterval(interval);
    interval = setInterval(mainLoop, 1000 / 60);
  };
  postMessage({ isReady: true });
});
