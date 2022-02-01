const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async () => loadAmmo());

// Skipped to reflect current state
test.skip('userData', (t) => {
  const transform = new Ammo.btTransform();
  transform.setIdentity();

  const vec = new Ammo.btVector3();
  const quat = new Ammo.btQuaternion();
  quat.setValue(0, 0, 0, 1);

  // Create box shape
  vec.setValue(0.5, 0.5, 0.5);
  const boxShape = new Ammo.btBoxShape(vec);

  // Create rigid body
  vec.setValue(0, 0, 0);
  transform.setOrigin(vec);
  transform.setRotation(quat);
  const motionState = new Ammo.btDefaultMotionState(transform);
  const mass = 10;
  boxShape.calculateLocalInertia(mass, vec);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    boxShape,
    vec
  );
  const rigidBody = new Ammo.btRigidBody(rbInfo);

  // Note that in bullet, the user pointer and index are in an union.

  let theValue = 1234;

  rigidBody.setUserPointer(theValue);
  const userPointer1 = rigidBody.getUserPointer();
  t.assert(userPointer1.ptr == theValue, 'User pointer is not the same');

  theValue = 4567;

  rigidBody.setUserIndex(theValue);
  const userIndex1 = rigidBody.getUserIndex();
  t.assert(userIndex1 == theValue, 'User index is not the same');

  Ammo.destroy(rigidBody.getCollisionShape());
  Ammo.destroy(motionState);
  Ammo.destroy(rigidBody);
  Ammo.destroy(rbInfo);
  Ammo.destroy(vec);
  Ammo.destroy(quat);
  Ammo.destroy(transform);
});
