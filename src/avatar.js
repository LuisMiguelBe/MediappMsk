import * as THREE from 'three';

// Device constants
const WIDTH = 1920;
const HEIGHT = 1080;
const SMOOTHING = 0.2; // Reduced for more responsive but stable motion
const VISTHRESH_BASE = 0.7; // Base visibility threshold
const VISTHRESH_MIN = 0.4; // Minimum threshold for low-confidence fallback

// Pose constants (unchanged)
const POSE_INDICES = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_FOOT: 31,
    RIGHT_FOOT: 32
};

// Hand constants (unchanged)
const HAND_INDICES = {
    WRIST: 0,
    INDEX1: 5,
    MIDDLE1: 9,
    RING1: 13,
    PINKY1: 17
};

// Face constants (added more landmarks for better expressiveness)
const FACE_INDICES = {
    NOSE: 1,
    NASAL: 4,
    LEFT_EYE: 454,
    RIGHT_EYE: 234,
    FOREHEAD: 10,
    CHIN: 152,
    MOUTH_LEFT: 61,
    MOUTH_RIGHT: 291
};

// Initialize skeleton and bones
let skeleton, spine, neckBone, morphTargets, morphDict;
let leftShoulderBone, leftElbowBone, leftWristBone, rightShoulderBone, rightElbowBone, rightWristBone;
let leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone;
let leftHandBones, rightHandBones;

// Store previous rotations for EMA smoothing
const boneRotations = new Map();

// Eyelash names (unchanged)
const eyelashNames = ["default", "Eyelashes", "Ch22_Eyelashes"];

// Load avatar function
export async function Avatar(name, loader) {
    const avatar = await loader.loadAsync(`/avatars/${name}.fbx`);

    // Skinned Mesh
    const skinnedMesh = avatar.getObjectByName("Body");
    if (skinnedMesh) {
        morphTargets = skinnedMesh.morphTargetInfluences;
        morphDict = skinnedMesh.morphTargetDictionary;
    } else {
        console.warn("Skinned mesh 'Body' not found in avatar.");
    }

    // Skeleton / Bone
    skeleton = avatar.getObjectByName("mixamorigHips");
    if (!skeleton) {
        console.error("Skeleton 'mixamorigHips' not found.");
        return avatar;
    }
    spine = skeleton.getObjectByName("mixamorigSpine");
    neckBone = skeleton.getObjectByName("mixamorigHead");

    // Upper body bones (optimized retrieval with null checks)
    leftShoulderBone = skeleton.getObjectByName("mixamorigRightArm");
    leftElbowBone = leftShoulderBone?.getObjectByName("mixamorigRightForeArm");
    leftWristBone = leftElbowBone?.getObjectByName("mixamorigRightHand");
    rightShoulderBone = skeleton.getObjectByName("mixamorigLeftArm");
    rightElbowBone = rightShoulderBone?.getObjectByName("mixamorigLeftForeArm");
    rightWristBone = rightElbowBone?.getObjectByName("mixamorigLeftHand");

    // Lower body bones
    leftHipBone = skeleton.getObjectByName("mixamorigRightUpLeg");
    leftKneeBone = leftHipBone?.getObjectByName("mixamorigRightLeg");
    leftAnkleBone = leftKneeBone?.getObjectByName("mixamorigRightFoot");
    leftFootBone = leftAnkleBone?.getObjectByName("mixamorigRightToe_End");
    rightHipBone = skeleton.getObjectByName("mixamorigLeftUpLeg");
    rightKneeBone = rightHipBone?.getObjectByName("mixamorigLeftLeg");
    rightAnkleBone = rightKneeBone?.getObjectByName("mixamorigLeftFoot");
    rightFootBone = rightAnkleBone?.getObjectByName("mixamorigLeftToe_End");

    // Hand bones
    leftHandBones = getHandBones(leftWristBone, "mixamorigRightHand");
    rightHandBones = getHandBones(rightWristBone, "mixamorigLeftHand");

    // Hide eyelashes
    eyelashNames.forEach((name) => {
        const eyelash = avatar.getObjectByName(name);
        if (eyelash) {
            eyelash.visible = false;
        }
    });

    // Set shadows
    avatar.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return avatar;
}

function getHandBones(wristBone, prefix) {
    if (!wristBone) return [];
    const bones = [
        wristBone,
        wristBone.getObjectByName(`${prefix}Thumb1`),
        wristBone.getObjectByName(`${prefix}Thumb2`),
        wristBone.getObjectByName(`${prefix}Thumb3`),
        wristBone.getObjectByName(`${prefix}Thumb4`),
        wristBone.getObjectByName(`${prefix}Index1`),
        wristBone.getObjectByName(`${prefix}Index2`),
        wristBone.getObjectByName(`${prefix}Index3`),
        wristBone.getObjectByName(`${prefix}Index4`),
        wristBone.getObjectByName(`${prefix}Middle1`),
        wristBone.getObjectByName(`${prefix}Middle2`),
        wristBone.getObjectByName(`${prefix}Middle3`),
        wristBone.getObjectByName(`${prefix}Middle4`),
        wristBone.getObjectByName(`${prefix}Ring1`),
        wristBone.getObjectByName(`${prefix}Ring2`),
        wristBone.getObjectByName(`${prefix}Ring3`),
        wristBone.getObjectByName(`${prefix}Ring4`),
        wristBone.getObjectByName(`${prefix}Pinky1`),
        wristBone.getObjectByName(`${prefix}Pinky2`),
        wristBone.getObjectByName(`${prefix}Pinky3`),
        wristBone.getObjectByName(`${prefix}Pinky4`)
    ];
    return bones.filter(bone => bone); // Remove undefined bones
}

export function setPose(poseLandmarks, poseWorldLandmarks) {
    if (!poseWorldLandmarks || !poseLandmarks) return;

    const userJoints = poseWorldLandmarks.map(landmark => {
        if (!landmark) return new THREE.Vector3();
        // Flip z-axis to align with THREE.js coordinate system
        return new THREE.Vector3(landmark.x, landmark.y, -landmark.z);
    });

    // Adaptive visibility thresholds
    const rightShoulderVis = poseWorldLandmarks[POSE_INDICES.RIGHT_SHOULDER]?.visibility || 0;
    const leftShoulderVis = poseWorldLandmarks[POSE_INDICES.LEFT_SHOULDER]?.visibility || 0;
    const rightHipVis = poseWorldLandmarks[POSE_INDICES.RIGHT_HIP]?.visibility || 0;
    const leftHipVis = poseWorldLandmarks[POSE_INDICES.LEFT_HIP]?.visibility || 0;
    const visThreshold = Math.max(VISTHRESH_MIN, Math.min(VISTHRESH_BASE, (rightShoulderVis + leftShoulderVis) / 2));

    if (rightShoulderVis > visThreshold && leftShoulderVis > visThreshold) {
        setUpperBodyPose(userJoints);
    }

    if (rightHipVis > visThreshold && leftHipVis > visThreshold) {
        setLowerBodyPose(userJoints, poseLandmarks);
    } else {
        resetLegs();
    }
}

function setUpperBodyPose(userJoints) {
    if (!spine || !leftShoulderBone || !rightShoulderBone) return;

    // Compute shoulder orientation
    const shoulderX = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().sub(userJoints[POSE_INDICES.LEFT_SHOULDER]).normalize();
    const shoulderY = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().lerp(userJoints[POSE_INDICES.LEFT_SHOULDER], 0.5).normalize();
    const shoulderZ = shoulderX.clone().cross(shoulderY).normalize();

    // Spine rotation
    const rotX = Math.acos(shoulderZ.y) - Math.PI / 2;
    const rotY = -Math.acos(shoulderZ.x) + Math.PI / 2;
    const rotZ = Math.acos(shoulderY.x) - Math.PI / 2;
    smoothRotation(spine, rotX, rotY, rotZ, 'spine');

    // Arm poses
    setArmPose(userJoints, leftShoulderBone, leftElbowBone, leftWristBone, shoulderX, shoulderY, shoulderZ,
        POSE_INDICES.LEFT_SHOULDER, POSE_INDICES.LEFT_ELBOW, POSE_INDICES.LEFT_WRIST, POSE_INDICES.LEFT_PINKY, POSE_INDICES.LEFT_INDEX, 'leftArm');
    setArmPose(userJoints, rightShoulderBone, rightElbowBone, rightWristBone, shoulderX, shoulderY, shoulderZ,
        POSE_INDICES.RIGHT_SHOULDER, POSE_INDICES.RIGHT_ELBOW, POSE_INDICES.RIGHT_WRIST, POSE_INDICES.RIGHT_PINKY, POSE_INDICES.RIGHT_INDEX, 'rightArm');
}

function setLowerBodyPose(userJoints, poseLandmarks) {
    if (!skeleton || !spine) return;

    // Compute hip orientation
    const hipX = userJoints[POSE_INDICES.RIGHT_HIP].clone().sub(userJoints[POSE_INDICES.LEFT_HIP]).normalize();
    const hipY = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().lerp(userJoints[POSE_INDICES.LEFT_SHOULDER], 0.5).normalize();
    const hipZ = hipX.clone().cross(hipY).normalize();

    // Skeleton and spine rotation
    const rotY = -Math.acos(hipZ.x) + Math.PI / 2;
    smoothRotation(skeleton, 0, rotY, 0, 'skeleton');
    smoothRotation(spine, Math.PI / 4, -rotY, 0, 'spineLower');

    // Adjust skeleton position based on hip landmarks
    const LH = new THREE.Vector3(poseLandmarks[POSE_INDICES.LEFT_HIP].x, poseLandmarks[POSE_INDICES.LEFT_HIP].y, 0);
    const RH = new THREE.Vector3(poseLandmarks[POSE_INDICES.RIGHT_HIP].x, poseLandmarks[POSE_INDICES.RIGHT_HIP].y, 0);
    const diff = new THREE.Vector3().subVectors(LH, RH).divideScalar(3);
    const midpoint = new THREE.Vector3().addVectors(RH, diff);
    const userHeight = RH.distanceTo(LH) * 1.8;
    skeleton.position.lerp(new THREE.Vector3(0, -userHeight * (midpoint.y - 0.5), 0), SMOOTHING);

    // Leg poses
    setLegPose(userJoints, leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, hipX, hipY, hipZ,
        POSE_INDICES.LEFT_HIP, POSE_INDICES.LEFT_KNEE, POSE_INDICES.LEFT_ANKLE, POSE_INDICES.LEFT_FOOT, 'leftLeg');
    setLegPose(userJoints, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone, hipX, hipY, hipZ,
        POSE_INDICES.RIGHT_HIP, POSE_INDICES.RIGHT_KNEE, POSE_INDICES.RIGHT_ANKLE, POSE_INDICES.RIGHT_FOOT, 'rightLeg');
}

function setArmPose(userJoints, shoulderBone, elbowBone, wristBone, shoulderX, shoulderY, shoulderZ, shoulderIndex, elbowIndex, wristIndex, pinkyIndex, indexIndex, bonePrefix) {
    if (!shoulderBone || !elbowBone || !wristBone) return;

    // Upper arm
    const upperArm = userJoints[elbowIndex].clone().sub(userJoints[shoulderIndex]).normalize();
    const upperArmProjection = projectOntoPlane(upperArm, shoulderX, shoulderY, shoulderZ);
    const shoulderRotation = getRotationFromProjection(upperArmProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(shoulderBone, shoulderRotation.x, shoulderRotation.y, shoulderRotation.z, `${bonePrefix}_shoulder`);

    // Lower arm
    const lowerArm = userJoints[wristIndex].clone().sub(userJoints[elbowIndex]).normalize();
    const lowerArmProjection = projectOntoPlane(lowerArm, shoulderX, shoulderY, shoulderZ);
    const elbowRotation = getRotationFromProjection(lowerArmProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(elbowBone, elbowRotation.x, elbowRotation.y, elbowRotation.z, `${bonePrefix}_elbow`);

    // Wrist
    const hand = userJoints[pinkyIndex].clone().add(userJoints[indexIndex]).divideScalar(2).sub(userJoints[wristIndex]).normalize();
    const handProjection = projectOntoPlane(hand, shoulderX, shoulderY, shoulderZ);
    const wristRotation = getRotationFromProjection(handProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(wristBone, wristRotation.x, wristRotation.y, wristRotation.z, `${bonePrefix}_wrist`);
}

function setLegPose(userJoints, hipBone, kneeBone, ankleBone, footBone, hipX, hipY, hipZ, hipIndex, kneeIndex, ankleIndex, footIndex, bonePrefix) {
    if (!hipBone || !kneeBone || !ankleBone || !footBone) return;

    // Upper leg
    const upperLeg = userJoints[kneeIndex].clone().sub(userJoints[hipIndex]).normalize();
    const upperLegProjection = projectOntoPlane(upperLeg, hipX, hipY, hipZ);
    const hipRotation = getRotationFromProjection(upperLegProjection, hipX, hipY, hipZ);
    smoothRotation(hipBone, hipRotation.x, hipRotation.y, hipRotation.z, `${bonePrefix}_hip`);

    // Lower leg
    const lowerLeg = userJoints[ankleIndex].clone().sub(userJoints[kneeIndex]).normalize();
    const lowerLegProjection = projectOntoPlane(lowerLeg, hipX, hipY, hipZ);
    const kneeRotation = getRotationFromProjection(lowerLegProjection, hipX, hipY, hipZ);
    smoothRotation(kneeBone, kneeRotation.x, kneeRotation.y, kneeRotation.z, `${bonePrefix}_knee`);

    // Foot
    const foot = userJoints[footIndex].clone().sub(userJoints[ankleIndex]).normalize();
    const footProjection = projectOntoPlane(foot, hipX, hipY, hipZ);
    const ankleRotation = getRotationFromProjection(footProjection, hipX, hipY, hipZ);
    smoothRotation(ankleBone, ankleRotation.x, ankleRotation.y, ankleRotation.z, `${bonePrefix}_ankle`);
}

function projectOntoPlane(vector, xAxis, yAxis, zAxis) {
    const projectionX = vector.dot(xAxis);
    const projectionY = vector.dot(yAxis);
    const projectionZ = vector.dot(zAxis);
    return new THREE.Vector3(projectionX, projectionY, projectionZ).normalize();
}

function getRotationFromProjection(projection, xAxis, yAxis, zAxis) {
    const rotX = Math.acos(projection.dot(xAxis)) - Math.PI / 2;
    const rotY = Math.acos(projection.dot(yAxis)) - Math.PI / 2;
    const rotZ = Math.acos(projection.dot(zAxis)) - Math.PI / 2;
    return { x: rotX, y: rotY, z: rotZ };
}

function smoothRotation(bone, rotX, rotY, rotZ, boneKey) {
    if (!bone) return;

    // Initialize previous rotation if not set
    if (!boneRotations.has(boneKey)) {
        boneRotations.set(boneKey, { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z });
    }

    const prev = boneRotations.get(boneKey);
    // Exponential Moving Average for smoother transitions
    bone.rotation.x = prev.x + (rotX - prev.x) * SMOOTHING;
    bone.rotation.y = prev.y + (rotY - prev.y) * SMOOTHING;
    bone.rotation.z = prev.z + (rotZ - prev.z) * SMOOTHING;

    // Update stored rotation
    boneRotations.set(boneKey, { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z });
}

function resetLegs() {
    if (leftHipBone) leftHipBone.rotation.set(0, 0, 0);
    if (leftKneeBone) leftKneeBone.rotation.set(0, 0, 0);
    if (leftAnkleBone) leftAnkleBone.rotation.set(0, 0, 0);
    if (rightHipBone) rightHipBone.rotation.set(0, 0, 0);
    if (rightKneeBone) rightKneeBone.rotation.set(0, 0, 0);
    if (rightAnkleBone) rightAnkleBone.rotation.set(0, 0, 0);
}

export function setFace(faceLandmarks) {
    if (!morphTargets || !morphDict || !faceLandmarks) return;

    // Enhanced face morph targets mapping with normalized distances
    const faceMorphMapping = {
        eyeBlinkLeft: () => {
            const eyeTop = faceLandmarks[FACE_INDICES.FOREHEAD].y;
            const eyeBot = faceLandmarks[FACE_INDICES.CHIN].y;
            const eyeDist = Math.abs(eyeTop - eyeBot);
            return eyeDist > 0 ? Math.min(1, Math.abs(faceLandmarks[FACE_INDICES.LEFT_EYE].y - eyeTop) / eyeDist) : 0;
        },
        eyeBlinkRight: () => {
            const eyeTop = faceLandmarks[FACE_INDICES.FOREHEAD].y;
            const eyeBot = faceLandmarks[FACE_INDICES.CHIN].y;
            const eyeDist = Math.abs(eyeTop - eyeBot);
            return eyeDist > 0 ? Math.min(1, Math.abs(faceLandmarks[FACE_INDICES.RIGHT_EYE].y - eyeTop) / eyeDist) : 0;
        },
        mouthOpen: () => {
            const mouthTop = faceLandmarks[FACE_INDICES.NOSE].y;
            const mouthBot = faceLandmarks[FACE_INDICES.CHIN].y;
            const mouthDist = Math.abs(mouthBot - mouthTop);
            return mouthDist > 0 ? Math.min(1, Math.abs(faceLandmarks[FACE_INDICES.MOUTH_LEFT].y - faceLandmarks[FACE_INDICES.MOUTH_RIGHT].y) / mouthDist) : 0;
        },
        browDownLeft: () => {
            const browBase = faceLandmarks[FACE_INDICES.FOREHEAD].y;
            return Math.min(1, Math.abs(faceLandmarks[FACE_INDICES.LEFT_EYE].y - browBase) / 0.1);
        },
        browDownRight: () => {
            const browBase = faceLandmarks[FACE_INDICES.FOREHEAD].y;
            return Math.min(1, Math.abs(faceLandmarks[FACE_INDICES.RIGHT_EYE].y - browBase) / 0.1);
        }
    };

    // Apply morph targets
    for (const [morphTarget, calcValue] of Object.entries(faceMorphMapping)) {
        const index = morphDict[morphTarget];
        if (index !== undefined) {
            morphTargets[index] = calcValue();
        }
    }
}

export function setHand(handLandmarks, left) {
    if (!handLandmarks) return;

    const handBones = left ? leftHandBones : rightHandBones;
    if (!handBones || handBones.length === 0) return;

    // Wrist orientation
    const wrist = new THREE.Vector3(handLandmarks[HAND_INDICES.WRIST].x, handLandmarks[HAND_INDICES.WRIST].y, -handLandmarks[HAND_INDICES.WRIST].z);
    const index = new THREE.Vector3(handLandmarks[HAND_INDICES.INDEX1].x, handLandmarks[HAND_INDICES.INDEX1].y, -handLandmarks[HAND_INDICES.INDEX1].z);
    const pinky = new THREE.Vector3(handLandmarks[HAND_INDICES.PINKY1].x, handLandmarks[HAND_INDICES.PINKY1].y, -handLandmarks[HAND_INDICES.PINKY1].z);
    const handDir = index.clone().sub(wrist).normalize();
    const handNormal = pinky.clone().sub(wrist).normalize().cross(handDir).normalize();
    const handUp = handDir.clone().cross(handNormal).normalize();

    const wristMatrix = new THREE.Matrix4().makeBasis(handDir, handUp, handNormal);
    const wristQuat = new THREE.Quaternion().setFromRotationMatrix(wristMatrix);
    smoothRotation(handBones[0], wristQuat.x, wristQuat.y, wristQuat.z, `${left ? 'left' : 'right'}_wrist`);

    // Finger rotations (simplified IK for fingers)
    const fingerIndices = [
        { start: HAND_INDICES.INDEX1, bones: [5, 6, 7, 8], name: 'index' },
        { start: HAND_INDICES.MIDDLE1, bones: [9, 10, 11, 12], name: 'middle' },
        { start: HAND_INDICES.RING1, bones: [13, 14, 15, 16], name: 'ring' },
        { start: HAND_INDICES.PINKY1, bones: [17, 18, 19, 20], name: 'pinky' }
    ];

    fingerIndices.forEach(finger => {
        const target = new THREE.Vector3(handLandmarks[finger.start].x, handLandmarks[finger.start].y, -handLandmarks[finger.start].z);
        const dir = target.clone().sub(wrist).normalize();
        finger.bones.forEach((boneIdx, i) => {
            if (handBones[boneIdx]) {
                const angle = Math.min(Math.PI / 4, dir.angleTo(handDir) * (i + 1) * 0.5); // Gradual bending
                smoothRotation(handBones[boneIdx], 0, angle, 0, `${left ? 'left' : 'right'}_${finger.name}_${i}`);
            }
        });
    });

    // Thumb (special case due to different orientation)
    if (handBones[1]) {
        const thumbTarget = new THREE.Vector3(handLandmarks[1].x, handLandmarks[1].y, -handLandmarks[1].z);
        const thumbDir = thumbTarget.clone().sub(wrist).normalize();
        const thumbAngle = Math.min(Math.PI / 3, thumbDir.angleTo(handDir));
        smoothRotation(handBones[1], thumbAngle, 0, 0, `${left ? 'left' : 'right'}_thumb`);
    }
}
