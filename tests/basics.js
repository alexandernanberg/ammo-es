const test = require('ava');
const loadAmmo = require('./helpers/load-ammo.js');

// Initialize global Ammo once for all tests:
test.before(async () => loadAmmo());

test('basics', (t) => {
  const vec = new Ammo.btVector3(4, 5, 6);
  t.is([vec.x(), vec.y(), vec.z()].toString(), '4,5,6');
  const quat = new Ammo.btVector4(14, 25, 36, 77);
  t.is([quat.x(), quat.y(), quat.z(), quat.w()].toString(), '14,25,36,77');

  const trans = new Ammo.btTransform(quat, vec);
  t.is([!!trans.getOrigin(), !!trans.getRotation()].toString(), 'true,true');
  t.is(
    [
      trans.getOrigin().x(),
      trans.getOrigin().y(),
      trans.getOrigin().z(),
    ].toString(),
    '4,5,6'
  );
  t.is(
    [
      trans.getRotation().x().toFixed(2),
      trans.getRotation().y().toFixed(2),
      trans.getRotation().z().toFixed(2),
      trans.getRotation().w().toFixed(2),
    ].toString(),
    '0.16,0.28,0.40,0.86'
  );

  const cl = new Ammo.ClosestRayResultCallback(vec, vec); // Make sure it is not an abstract base class (regression check)
  let found = false;
  for (const x in cl) {
    found = true;
  } // closure compiler can rename .ptr
  if (!found) throw 'zz no wrapped pointer!';
  t.is(typeof Ammo.ClosestRayResultCallback, 'function'); // make sure it was exposed

  (function () {
    const localInertia = new Ammo.btVector3(0, 0, 0);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    const myMotionState = new Ammo.btDefaultMotionState(startTransform);
    const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50));
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      0,
      myMotionState,
      groundShape,
      localInertia
    );
    const body = new Ammo.btRigidBody(rbInfo);
    new Ammo.btPoint2PointConstraint(body, new Ammo.btVector3(0, 0, 0)); // make sure we have the 2-param version of this
  })();

  (function () {
    // operators
    const a = new Ammo.btVector3(5, 6, 7);
    t.is(5, a.x());
    t.is(6, a.y());
    t.is(7, a.z());
    const result = a.op_mul(3);
    t.is(15, a.x());
    t.is(18, a.y());
    t.is(21, a.z());
    t.true(Ammo.compare(a, result));
  })();
});
