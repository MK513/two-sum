var Movement = pc.createScript("movePlayer");

Movement.attributes.add("speed", {
  type: "number",
  default: 450,
  description: "Controls the movement speed",
});

Movement.attributes.add("jumpForce", {
  type: "number",
  default: 5,
  description: "Controls the jump force",
});

Movement.prototype.initialize = function () {
  this.force = new pc.Vec3();
  this.isJumpable = false;
  this.spawnPoint = this.entity.getPosition().clone();
  this.entity.rigidbody.linearDamping = 0.6;
  this.entity.rigidbody.angularDamping = 0.6;
  this.entity.collision.on("collisionstart", this.onCollisionStart, this);
  // 엔티티가 초기화된 후에 window.movePlayer를 설정합니다.
  window.movePlayer = this.movePlayer.bind(this);
};

Movement.prototype.resetForces = function () {
  this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
  this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
};

Movement.prototype.onCollisionStart = function (t) {
  if (t.other.rigidbody) {
    this.isJumpable = true;
  }
};

Movement.prototype.onTriggerEnter = function (t) {
  if (t.tags.has("plain")) {
    this.resetForces();
    this.entity.rigidbody.teleport(this.spawnPoint);
    this.app.fire("player:reset");
  }
};

Movement.prototype.update = function (t) {
  var e = 0,
    i = 0;
  if (this.entity.getPosition().y < 0.5) {
    this.resetForces();
    this.entity.rigidbody.teleport(this.spawnPoint);
    this.app.fire("player:reset");
  }
  this.force.set(e, 0, i);
  this.entity.rigidbody.applyForce(this.force);
  if (this.isJumpable) {
    this.entity.rigidbody.applyImpulse(0, this.jumpForce, 0);
    this.isJumpable = false;
  }
};

// 외부에서 호출할 수 있는 movePlayer 함수 수정
Movement.prototype.movePlayer = function (direction) {
  console.log("movePlayer called with direction: " + direction); // 로그 추가
  var t = this.app.timeScale;
  var e = 0,
    i = 0; // i로 통일
  if (direction === "left") {
    e = -this.speed * t;
  } else if (direction === "right") {
    e = this.speed * t;
  } else if (direction === "up") {
    i = -this.speed * t;
  } else if (direction === "down") {
    i = this.speed * t;
  }
  this.force.set(e, 0, i);
  this.entity.rigidbody.applyForce(this.force);
  console.log("Force applied: " + this.force.toString()); // Force 적용 로그 추가
};


var onGoalAchieve = pc.createScript("onGoalAchieve");

function LoadScene(e, n, o, c) {
  var t = pc.Application.getApplication(),
    l = t.scenes.find(e);
  if (l) {
    var a = l.loaded;
    t.scenes.loadSceneData(l, function (e, l) {
      if (e) o && o.call(c, e);
      else {
        for (var i = null, r = t.root.children; r.length > 0; ) r[0].destroy();
        n.settings &&
          t.scenes.loadSceneSettings(l, function (e) {
            e && o && o.call(c, e);
          });
        n.hierarchy &&
          t.scenes.loadSceneHierarchy(l, function (e, n) {
            e ? o && o(e) : (i = n);
          });
        a || t.scenes.unloadSceneData(l);
        o && o.call(c, null, i);
      }
    });
  } else o && o.call(c, "Scene not found: " + e);
}

onGoalAchieve.prototype.initialize = function () {
  this.entity.collision.on("triggerenter", this.onTriggerEnter, this);
};

onGoalAchieve.prototype.onTriggerEnter = function (e) {
  e.tags.has("player") &&
    (console.log("Player has reached the goal!"),
    this.loadNextScene("NextScene"));
};

onGoalAchieve.prototype.loadNextScene = function (e) {
  LoadScene(e, { hierarchy: !0 }, function (e, n) {
    e
      ? console.error("Failed to load next scene:", e)
      : console.log("Next scene loaded successfully");
  });
};

var CameraController = pc.createScript("cameraController");

function eulerToQuaternion(t) {
  var i = pc.math.DEG_TO_RAD * t.x,
    e = pc.math.DEG_TO_RAD * t.y,
    s = pc.math.DEG_TO_RAD * t.z;
  var a = Math.cos(e / 2),
    n = Math.cos(s / 2),
    o = Math.cos(i / 2);
  var r = Math.sin(e / 2),
    f = Math.sin(s / 2),
    h = Math.sin(i / 2);
  var l = new pc.Quat();
  l.x = r * f * o + a * n * h;
  l.y = r * n * o + a * f * h;
  l.z = a * f * o - r * n * h;
  l.w = a * n * o - r * f * h;
  return l;
}

CameraController.attributes.add("player", { type: "entity" });
CameraController.attributes.add("offset", { type: "vec3" });
CameraController.attributes.add("rotation", { type: "vec3" });
CameraController.attributes.add("flagX", { type: "number", default: 0 });
CameraController.attributes.add("flagZ", { type: "number", default: 1 });

CameraController.prototype.initialize = function () {
  this.initialOffset = new pc.Vec3(0, 5, 13);
  this.offset = this.initialOffset.clone();
  this.entity.setPosition(this.player.getPosition().add(this.initialOffset));
  this.offsetIndex = 0;
  this.offsets = [
    this.initialOffset.clone(),
    new pc.Vec3(
      this.initialOffset.z,
      this.initialOffset.y,
      this.initialOffset.x
    ),
    new pc.Vec3(
      -this.initialOffset.x,
      this.initialOffset.y,
      -this.initialOffset.z
    ),
    new pc.Vec3(
      -this.initialOffset.z,
      this.initialOffset.y,
      -this.initialOffset.x
    ),
  ];
  this.isSpacePressed = !1;
  this.rotation = this.entity.getRotation().getEulerAngles();
};

CameraController.prototype.update = function (t) {
  this.app.keyboard.isPressed(pc.KEY_SPACE)
    ? this.isSpacePressed ||
      ((this.isSpacePressed = !0),
      (this.offsetIndex = (this.offsetIndex + 1) % this.offsets.length),
      (this.offset = this.offsets[this.offsetIndex]),
      (this.rotation.y = (this.rotation.y + 90) % 360),
      this.entity.setRotation(eulerToQuaternion(this.rotation)))
    : (this.isSpacePressed = !1);
  this.entity.setPosition(this.player.getPosition().add(this.offset));
};

var DisappearOnContact = pc.createScript("disappearOnContact");

DisappearOnContact.prototype.initialize = function () {
  this.entity.collision.on("collisionstart", this.onCollisionStart, this);
  this.app.on("scene:hierarchy:loaded", this.onSceneReloaded, this);
  this.app.on("player:reset", this.onPlayerReset, this);
};

DisappearOnContact.prototype.onCollisionStart = function (t) {
  this.entity.enabled = !1;
};

DisappearOnContact.prototype.onPlayerReset = function () {
  this.entity.enabled = !0;
};

DisappearOnContact.prototype.swap = function (t) {
  this.entity.collision.off("collisionstart", t.onCollisionStart, t);
  this.app.off("player:reset", t.onPlayerReset, t);
};

var startGameBtn = pc.createScript("startGameBtn");

function loadScene(e, n, t, a) {
  var c = pc.Application.getApplication(),
    i = c.scenes.find(e);
  if (i) {
    var l = i.loaded;
    c.scenes.loadSceneData(i, function (e, i) {
      if (e) t && t.call(a, e);
      else {
        for (var s = null, o = c.root.children; o.length > 0; ) o[0].destroy();
        n.settings &&
          c.scenes.loadSceneSettings(i, function (e) {
            e && t && t.call(a, e);
          });
        n.hierarchy &&
          c.scenes.loadSceneHierarchy(i, function (e, n) {
            e ? t && t.call(a, e) : ((s = n), c.fire("scene:hierarchy:loaded"));
          });
        l || c.scenes.unloadSceneData(i);
        t && t.call(a, null, s);
      }
    });
  } else t && t.call(a, "Scene not found: " + e);
}

startGameBtn.attributes.add("sceneName", { type: "string" });

startGameBtn.prototype.initialize = function () {
  this.entity.button.once(
    "click",
    function () {
      loadScene(this.sceneName, { hierarchy: !0 });
    },
    this
  );
};

var ToneInit = pc.createScript("toneInit");

ToneInit.prototype.initialize = function () {
  const n = [
    { note: "A2", duration: "8n", timing: 0 },
    { note: "B2", duration: "8n", timing: 0.25 },
    { note: "C3", duration: "8n", timing: 0.5 },
    { note: "D3", duration: "8n", timing: 0.75 },
    { note: "E3", duration: "8n", timing: 1 },
    { note: "F3", duration: "8n", timing: 1.25 },
    { note: "G#3", duration: "8n", timing: 1.5 },
  ];
  const t = new Tone.Volume(-10).toDestination();
  const o = new Tone.Synth();
  o.connect(t);
  n.forEach((n) => {
    Tone.Transport.schedule((t) => {
      o.triggerAttackRelease(n.note, n.duration, t);
    }, n.timing);
  });
  const e = n;
};
