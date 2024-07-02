import * as THREE from 'three';

// Device constants
const WIDTH = 1920;
const HEIGHT = 1080;
const SMOOTHING = 0.25;
const VISTHRESH = 0.9;

// Pose constants
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

// Hand constants
const HAND_INDICES = {
    WRIST: 0,
    INDEX1: 5,
    MIDDLE1: 9,
    RING1: 13,
    PINKY1: 17
};

// Face constants
const FACE_INDICES = {
    NOSE: 1,
    NASAL: 4,       
    LEFT: 454,      
    RIGHT: 234,     
    TOP: 10,        
    BOT: 152        
};

// Initialize skeleton and bones
let skeleton, spine, neckBone, morphTargets, morphDict;
let leftShoulderBone, leftElbowBone, leftWristBone, rightShoulderBone, rightElbowBone, rightWristBone;
let leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone;
let leftHandBones, rightHandBones;

const eyelashNames = ["default", "Eyelashes", "Ch22_Eyelashes"];

// Load avatar function
export async function Avatar(name, loader) {
    const avatar = await loader.loadAsync(`/avatars/${name}.fbx`);
    
    // Skinned Mesh
    const skinnedMesh = avatar.getObjectByName("Body");
    if (skinnedMesh) {
        morphTargets = skinnedMesh.morphTargetInfluences;
        morphDict = skinnedMesh.morphTargetDictionary;
    }

    // Skeleton / Bone
    skeleton = avatar.getObjectByName("mixamorigHips");
    spine = avatar.getObjectByName("mixamorigSpine");
    neckBone = skeleton.getObjectByName("mixamorigHead");

    // Upper body bones
    leftShoulderBone = skeleton.getObjectByName("mixamorigRightArm");
    leftElbowBone = leftShoulderBone.getObjectByName("mixamorigRightForeArm");
    leftWristBone = leftElbowBone.getObjectByName("mixamorigRightHand");
    rightShoulderBone = skeleton.getObjectByName("mixamorigLeftArm");
    rightElbowBone = rightShoulderBone.getObjectByName("mixamorigLeftForeArm");
    rightWristBone = rightElbowBone.getObjectByName("mixamorigLeftHand");

    // Lower body bones
    leftHipBone = skeleton.getObjectByName("mixamorigRightUpLeg");
    leftKneeBone = leftHipBone.getObjectByName("mixamorigRightLeg");
    leftAnkleBone = leftKneeBone.getObjectByName("mixamorigRightFoot");
    leftFootBone = leftAnkleBone.getObjectByName("mixamorigRightToe_End");
    rightHipBone = skeleton.getObjectByName("mixamorigLeftUpLeg");
    rightKneeBone = rightHipBone.getObjectByName("mixamorigLeftLeg");
    rightAnkleBone = rightKneeBone.getObjectByName("mixamorigLeftFoot");
    rightFootBone = rightAnkleBone.getObjectByName("mixamorigLeftToe_End");

    // Hand bones
    leftHandBones = getHandBones(leftWristBone, "mixamorigRightHand");
    rightHandBones = getHandBones(rightWristBone, "mixamorigLeftHand");

    // Hide eyelashes temporarily
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
    return [
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
}

export function setPose(poseLandmarks, poseWorldLandmarks) {
    const userJoints = poseWorldLandmarks.map(landmark => new THREE.Vector3(landmark.x, landmark.y, landmark.z).negate());

    const rightShoulderVis = poseWorldLandmarks[POSE_INDICES.RIGHT_SHOULDER].visibility;
    const leftShoulderVis = poseWorldLandmarks[POSE_INDICES.LEFT_SHOULDER].visibility;
    const rightHipVis = poseWorldLandmarks[POSE_INDICES.RIGHT_HIP].visibility;
    const leftHipVis = poseWorldLandmarks[POSE_INDICES.LEFT_HIP].visibility;

    if (rightShoulderVis > VISTHRESH && leftShoulderVis > VISTHRESH) {
        setUpperBodyPose(userJoints);
    }

    if (rightHipVis > VISTHRESH && leftHipVis > VISTHRESH) {
        setLowerBodyPose(userJoints, poseLandmarks);
    } else {
        resetLegs();
    }
}

function setUpperBodyPose(userJoints) {
    const shoulderX = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().sub(userJoints[POSE_INDICES.LEFT_SHOULDER]).normalize();
    const shoulderY = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().lerp(userJoints[POSE_INDICES.LEFT_SHOULDER], 0.5).normalize();
    const shoulderZ = shoulderX.clone().cross(shoulderY).normalize();

    const rotX = Math.acos(shoulderZ.y) - Math.PI / 2;
    const rotY = -Math.acos(shoulderZ.x) + Math.PI / 2;
    const rotZ = Math.acos(shoulderY.x) - Math.PI / 2;
    smoothRotation(spine, rotX, rotY, rotZ);

    setArmPose(userJoints, leftShoulderBone, leftElbowBone, leftWristBone, shoulderX, shoulderY, shoulderZ, POSE_INDICES.LEFT_SHOULDER, POSE_INDICES.LEFT_ELBOW, POSE_INDICES.LEFT_WRIST, POSE_INDICES.LEFT_PINKY, POSE_INDICES.LEFT_INDEX);
    setArmPose(userJoints, rightShoulderBone, rightElbowBone, rightWristBone, shoulderX, shoulderY, shoulderZ, POSE_INDICES.RIGHT_SHOULDER, POSE_INDICES.RIGHT_ELBOW, POSE_INDICES.RIGHT_WRIST, POSE_INDICES.RIGHT_PINKY, POSE_INDICES.RIGHT_INDEX);
}

function setLowerBodyPose(userJoints, poseLandmarks) {
    const hipX = userJoints[POSE_INDICES.RIGHT_HIP].clone().sub(userJoints[POSE_INDICES.LEFT_HIP]).normalize();
    const hipY = userJoints[POSE_INDICES.RIGHT_SHOULDER].clone().lerp(userJoints[POSE_INDICES.LEFT_SHOULDER], 0.5).normalize();
    const hipZ = hipX.clone().cross(hipY).normalize();

    const rotY = -Math.acos(hipZ.x) + Math.PI / 2;
    smoothRotation(skeleton, 0, rotY, 0);
    smoothRotation(spine, Math.PI / 4, -rotY, 0);

    const LH = new THREE.Vector3(poseLandmarks[POSE_INDICES.LEFT_HIP].x, poseLandmarks[POSE_INDICES.LEFT_HIP].y, 0);
    const RH = new THREE.Vector3(poseLandmarks[POSE_INDICES.RIGHT_HIP].x, poseLandmarks[POSE_INDICES.RIGHT_HIP].y, 0);
    const diff = new THREE.Vector3().subVectors(LH, RH).divideScalar(3);
    const midpoint = new THREE.Vector3().addVectors(RH, diff);
    const userHeight = RH.distanceTo(LH) * 1.8;
    skeleton.position.set(0, -userHeight * (midpoint.y - 0.5), 0);

    setLegPose(userJoints, leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, hipX, hipY, hipZ, POSE_INDICES.LEFT_HIP, POSE_INDICES.LEFT_KNEE, POSE_INDICES.LEFT_ANKLE, POSE_INDICES.LEFT_FOOT);
    setLegPose(userJoints, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone, hipX, hipY, hipZ, POSE_INDICES.RIGHT_HIP, POSE_INDICES.RIGHT_KNEE, POSE_INDICES.RIGHT_ANKLE, POSE_INDICES.RIGHT_FOOT);
}

function setArmPose(userJoints, shoulderBone, elbowBone, wristBone, shoulderX, shoulderY, shoulderZ, shoulderIndex, elbowIndex, wristIndex, pinkyIndex, indexIndex) {
    const upperArm = userJoints[elbowIndex].clone().sub(userJoints[shoulderIndex]).normalize();
    const upperArmProjection = projectOntoPlane(upperArm, shoulderX, shoulderY, shoulderZ);
    const shoulderRotation = getRotationFromProjection(upperArmProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(shoulderBone, shoulderRotation.x, shoulderRotation.y, shoulderRotation.z);

    const lowerArm = userJoints[wristIndex].clone().sub(userJoints[elbowIndex]).normalize();
    const lowerArmProjection = projectOntoPlane(lowerArm, shoulderX, shoulderY, shoulderZ);
    const elbowRotation = getRotationFromProjection(lowerArmProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(elbowBone, elbowRotation.x, elbowRotation.y, elbowRotation.z);

    const hand = userJoints[pinkyIndex].clone().add(userJoints[indexIndex]).divideScalar(2).sub(userJoints[wristIndex]).normalize();
    const handProjection = projectOntoPlane(hand, shoulderX, shoulderY, shoulderZ);
    const wristRotation = getRotationFromProjection(handProjection, shoulderX, shoulderY, shoulderZ);
    smoothRotation(wristBone, wristRotation.x, wristRotation.y, wristRotation.z);
}

function setLegPose(userJoints, hipBone, kneeBone, ankleBone, footBone, hipX, hipY, hipZ, hipIndex, kneeIndex, ankleIndex, footIndex) {
    const upperLeg = userJoints[kneeIndex].clone().sub(userJoints[hipIndex]).normalize();
    const upperLegProjection = projectOntoPlane(upperLeg, hipX, hipY, hipZ);
    const hipRotation = getRotationFromProjection(upperLegProjection, hipX, hipY, hipZ);
    smoothRotation(hipBone, hipRotation.x, hipRotation.y, hipRotation.z);

    const lowerLeg = userJoints[ankleIndex].clone().sub(userJoints[kneeIndex]).normalize();
    const lowerLegProjection = projectOntoPlane(lowerLeg, hipX, hipY, hipZ);
    const kneeRotation = getRotationFromProjection(lowerLegProjection, hipX, hipY, hipZ);
    smoothRotation(kneeBone, kneeRotation.x, kneeRotation.y, kneeRotation.z);

    const foot = userJoints[footIndex].clone().sub(userJoints[ankleIndex]).normalize();
    const footProjection = projectOntoPlane(foot, hipX, hipY, hipZ);
    const ankleRotation = getRotationFromProjection(footProjection, hipX, hipY, hipZ);
    smoothRotation(ankleBone, ankleRotation.x, ankleRotation.y, ankleRotation.z);
}

function projectOntoPlane(vector, xAxis, yAxis, zAxis) {
    const projectionX = vector.clone().dot(xAxis);
    const projectionY = vector.clone().dot(yAxis);
    const projectionZ = vector.clone().dot(zAxis);
    return new THREE.Vector3(projectionX, projectionY, projectionZ).normalize();
}

function getRotationFromProjection(projection, xAxis, yAxis, zAxis) {
    const rotX = Math.acos(projection.dot(xAxis)) - Math.PI / 2;
    const rotY = Math.acos(projection.dot(yAxis)) - Math.PI / 2;
    const rotZ = Math.acos(projection.dot(zAxis)) - Math.PI / 2;
    return { x: rotX, y: rotY, z: rotZ };
}

function smoothRotation(bone, rotX, rotY, rotZ) {
    bone.rotation.x = bone.rotation.x + (rotX - bone.rotation.x) * SMOOTHING;
    bone.rotation.y = bone.rotation.y + (rotY - bone.rotation.y) * SMOOTHING;
    bone.rotation.z = bone.rotation.z + (rotZ - bone.rotation.z) * SMOOTHING;
}

function resetLegs() {
    leftHipBone.rotation.set(0, 0, 0);
    leftKneeBone.rotation.set(0, 0, 0);
    leftAnkleBone.rotation.set(0, 0, 0);
    rightHipBone.rotation.set(0, 0, 0);
    rightKneeBone.rotation.set(0, 0, 0);
    rightAnkleBone.rotation.set(0, 0, 0);
}

export function setFace(faceLandmarks) {
    if (!morphTargets || !morphDict) return;

    // Define face morph targets mapping
    const faceMorphMapping = {
        eyeBlinkLeft: [FACE_INDICES.TOP, FACE_INDICES.BOT],
        eyeBlinkRight: [FACE_INDICES.TOP, FACE_INDICES.BOT],
        browDownLeft: [FACE_INDICES.TOP, FACE_INDICES.BOT],
        browDownRight: [FACE_INDICES.TOP, FACE_INDICES.BOT],
        mouthOpen: [FACE_INDICES.BOT]
    };

    // Set face morph targets
    for (const [morphTarget, indices] of Object.entries(faceMorphMapping)) {
        const index = morphDict[morphTarget];
        if (index !== undefined) {
            const morphValue = indices.reduce((sum, idx) => sum + faceLandmarks[idx].y, 0) / indices.length;
            morphTargets[index] = morphValue;
        }
    }
}

export function setHand(handLandmarks, left) {
    const handBones = left ? leftHandBones : rightHandBones;

    handBones[0].rotation.set(0, 0, 0); // Wrist
    handBones[1].rotation.set(0, 0, 0); // Thumb1
    handBones[2].rotation.set(0, 0, 0); // Thumb2
    handBones[3].rotation.set(0, 0, 0); // Thumb3
    handBones[4].rotation.set(0, 0, 0); // Thumb4
    handBones[5].rotation.set(0, 0, 0); // Index1
    handBones[6].rotation.set(0, 0, 0); // Index2
    handBones[7].rotation.set(0, 0, 0); // Index3
    handBones[8].rotation.set(0, 0, 0); // Index4
    handBones[9].rotation.set(0, 0, 0); // Middle1
    handBones[10].rotation.set(0, 0, 0); // Middle2
    handBones[11].rotation.set(0, 0, 0); // Middle3
    handBones[12].rotation.set(0, 0, 0); // Middle4
    handBones[13].rotation.set(0, 0, 0); // Ring1
    handBones[14].rotation.set(0, 0, 0); // Ring2
    handBones[15].rotation.set(0, 0, 0); // Ring3
    handBones[16].rotation.set(0, 0, 0); // Ring4
    handBones[17].rotation.set(0, 0, 0); // Pinky1
    handBones[18].rotation.set(0, 0, 0); // Pinky2
    handBones[19].rotation.set(0, 0, 0); // Pinky3
    handBones[20].rotation.set(0, 0, 0); // Pinky4
}

