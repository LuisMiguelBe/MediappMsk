import * as THREE from 'three';
import { Vector3 } from 'three';

// device constants
const WIDTH = 1920;
const HEIGHT = 1080;

const SMOOTHING = 0.25;
const VISTHRESH = 0.9;

// pose constants
const LEFTSHOULDER = 11;
const RIGHTSHOULDER = 12;
const LEFTELBOW = 13;
const RIGHTELBOW = 14;
const LEFTWRIST = 15;
const RIGHTWRIST = 16;
const LEFTPINKY = 17;
const RIGHTPINKY = 18;
const LEFTINDEX = 19;
const RIGHTINDEX = 20;
const LEFTHIP = 23;
const RIGHTHIP = 24;
const LEFTKNEE = 25;
const RIGHTKNEE = 26;
const LEFTANKLE = 27;
const RIGHTANKLE = 28;
const LEFTFOOT = 31;
const RIGHTFOOT = 32;

// hand constants
const WRIST = 0;
const INDEX1 = 5;
const MIDDLE1 = 9;
const RING1 = 13;
const PINKY1 = 17;

// face constants
const NOSE = 1;
const NASAL = 4;       // 1 point above nose
const LEFT = 454;      // left most point
const RIGHT = 234;     // right most point
const TOP = 10;        // top most point                       
const BOT = 152;       // bot most point

let skeleton, spine, neck, morphTargets, morphDict;
let leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist;
let leftHip, leftKnee, leftAnkle, leftFoot, rightHip, rightKnee, rightAnkle, rightFoot;
let leftHands, rightHands;

let prevLShoulderRot, prevLElbowRot, prevLWristRot;

const eyelashNames = ["default", "Eyelashes", "Ch22_Eyelashes"];
let isMixamo = false;

export async function Avatar(name, loader) {
    let avatar = await loader.loadAsync(`/avatars/${name}`);

    let headMeshName, bonePrefix;
    if (name.split('.')[1] == 'fbx') {
        // MIXAMO (only a subset)
        isMixamo = true;

        headMeshName = "Body";
        bonePrefix = "mixamorig";

        // hide eyelashes for now cus they render weirdly
        eyelashNames.forEach((name) => {
            let eyelash = avatar.getObjectByName(name);
            if (eyelash) {
                eyelash.visible = false;
                return;
            }
        });
    } else if (name.split('.')[1] == 'glb') {
        // READY PLAYER ME
        avatar = avatar["scene"]["children"]["0"];
        headMeshName = "Wolf3D_Head";
        bonePrefix = "";

        avatar.scale.setScalar(200);
    } else {
        console.log("Currently only support FBX and GLB.");
    }

    // Face
    let skinnedMesh = avatar.getObjectByName(headMeshName);
    if (skinnedMesh) {
        morphTargets = skinnedMesh.morphTargetInfluences;
        morphDict = skinnedMesh.morphTargetDictionary;
    }

    // Skeleton
    skeleton = avatar.getObjectByName(`${bonePrefix}Hips`);
    spine = skeleton.getObjectByName(`${bonePrefix}Spine`);
    neck = skeleton.getObjectByName(`${bonePrefix}Head`);

    leftShoulder = skeleton.getObjectByName(`${bonePrefix}RightArm`);
    leftElbow = leftShoulder.getObjectByName(`${bonePrefix}RightForeArm`);
    leftWrist = leftElbow.getObjectByName(`${bonePrefix}RightHand`);
    rightShoulder = skeleton.getObjectByName(`${bonePrefix}LeftArm`);
    rightElbow = rightShoulder.getObjectByName(`${bonePrefix}LeftForeArm`);
    rightWrist = rightElbow.getObjectByName(`${bonePrefix}LeftHand`);

    leftHip = skeleton.getObjectByName(`${bonePrefix}RightUpLeg`);
    leftKnee = leftHip.getObjectByName(`${bonePrefix}RightLeg`);
    leftAnkle = leftKnee.getObjectByName(`${bonePrefix}RightFoot`);
    leftFoot = leftAnkle.getObjectByName(`${bonePrefix}RightToe_End`);
    rightHip = skeleton.getObjectByName(`${bonePrefix}LeftUpLeg`);
    rightKnee = rightHip.getObjectByName(`${bonePrefix}LeftLeg`);
    rightAnkle = rightKnee.getObjectByName(`${bonePrefix}LeftFoot`);
    rightFoot = rightAnkle.getObjectByName(`${bonePrefix}LeftToe_End`);

    leftHands = [
        leftWrist,
        leftWrist.getObjectByName(`${bonePrefix}RightHandThumb1`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandThumb2`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandThumb3`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandThumb4`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandIndex1`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandIndex2`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandIndex3`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandIndex4`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandMiddle1`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandMiddle2`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandMiddle3`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandMiddle4`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandRing1`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandRing2`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandRing3`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandRing4`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandPinky1`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandPinky2`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandPinky3`),
        leftWrist.getObjectByName(`${bonePrefix}RightHandPinky4`)
    ]

    rightHands = [
        rightWrist,
        rightWrist.getObjectByName(`${bonePrefix}LeftHandThumb1`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandThumb2`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandThumb3`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandThumb4`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandIndex1`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandIndex2`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandIndex3`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandIndex4`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandMiddle1`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandMiddle2`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandMiddle3`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandMiddle4`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandRing1`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandRing2`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandRing3`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandRing4`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandPinky1`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandPinky2`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandPinky3`),
        rightWrist.getObjectByName(`${bonePrefix}LeftHandPinky4`)
    ]

    prevLShoulderRot = leftShoulder.quaternion;
    prevLElbowRot = leftElbow.quaternion;
    prevLWristRot = rightWrist.quaternion;

    avatar.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return avatar;
}

export function setPose(poseLandmarks, poseWorldLandmarks) {
    let userJoints = [];
    poseWorldLandmarks.forEach((landmark) => {
        userJoints.push(new THREE.Vector3(landmark.x, landmark.y, landmark.z));
    });

    let basisY = userJoints[LEFTSHOULDER].clone().sub(userJoints[RIGHTSHOULDER]).normalize();
    let basisZ = userJoints[RIGHTSHOULDER].clone().lerp(userJoints[LEFTSHOULDER], 0.5).negate().normalize();
    let basisX = basisZ.clone().cross(basisY).normalize();

    let basis = new THREE.Matrix3().set(
        basisX.x, basisY.x, basisZ.x,
        basisX.y, basisY.y, basisZ.y,
        basisX.z, basisY.z, basisZ.z
    );

    let bone = userJoints[LEFTELBOW].clone().sub(userJoints[LEFTSHOULDER]).normalize();
    let basisInv = basis.clone().invert();
    bone.applyMatrix3(basisInv);
    let rot = new THREE.Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), bone).normalize();
    prevLShoulderRot.slerp(rot, SMOOTHING);
    leftShoulder.setRotationFromQuaternion(prevLShoulderRot);
    prevLShoulderRot = leftShoulder.quaternion;
    updateBasis(rot, basisX, basisY, basisZ, basis);

    bone = userJoints[LEFTWRIST].clone().sub(userJoints[LEFTELBOW]).normalize();
    basisInv = basis.clone().invert();
    bone.applyMatrix3(basisInv);
    rot.setFromUnitVectors(new Vector3(0, 1, 0), bone).normalize();
    prevLElbowRot.slerp(rot, SMOOTHING);
    leftElbow.setRotationFromQuaternion(prevLElbowRot);
    prevLElbowRot = leftElbow.quaternion;
    updateBasis(rot, basisX, basisY, basisZ, basis);

    bone =  userJoints[LEFTINDEX].clone().lerp(userJoints[LEFTPINKY], 0.5).sub(userJoints[LEFTWRIST]).normalize();
    basisInv = basis.clone().invert();
    bone.applyMatrix3(basisInv);
    rot.setFromUnitVectors(new Vector3(0, 1, 0), bone).normalize();
    prevLWristRot.slerp(rot, SMOOTHING);
    leftWrist.setRotationFromQuaternion(prevLWristRot);
    prevLWristRot = leftWrist.quaternion;

    // let rightShoulderVis = poseWorldLandmarks[RIGHTSHOULDER].visibility;
    // let leftShoulderVis = poseWorldLandmarks[LEFTSHOULDER].visibility;
    // let rightHipVis = poseWorldLandmarks[RIGHTHIP].visibility;
    // let leftHipVis = poseWorldLandmarks[LEFTHIP].visibility;

    // // REQUIRED: both shoulders must be visible to track upperbody
    // if (rightShoulderVis > VISTHRESH && leftShoulderVis > VISTHRESH) {
    //     // shoulder local coordinate system
    //     // positive directions: x - leftShoulder -> rightShoulder,
    //     //                      y - hip -> shoulder,
    //     //                      z - user -> camera
    //     let shoulderX = userJoints[RIGHTSHOULDER].clone().sub(userJoints[LEFTSHOULDER]).normalize();
    //     let shoulderY = userJoints[RIGHTSHOULDER].clone().lerp(userJoints[LEFTSHOULDER], 0.5).normalize();
    //     let shoulderZ = shoulderX.clone().cross(shoulderY).normalize();

    //     // torso direction
    //     let thetaX = Math.acos(shoulderZ.x);
    //     let thetaY = Math.acos(shoulderZ.y);
    //     let thetaZ = Math.acos(shoulderY.x);
    //     let rotX = thetaY - 1.2 * Math.PI / 2;
    //     let rotY = - thetaX + Math.PI / 2;
    //     let rotZ = thetaZ - Math.PI / 2;
    //     smoothRotation(spine, rotX, rotY, rotZ);

    //     // left arm
    //     // let xAxis = shoulderX.clone();
    //     // let yAxis = shoulderY.clone();
    //     // let zAxis = shoulderZ.clone();
    //     let xAxis = shoulderZ.clone();
    //     let yAxis = shoulderX.clone().negate();
    //     let zAxis = shoulderY.clone().negate();
    //     let basis = new THREE.Matrix3().set(
    //         xAxis.x, yAxis.x, zAxis.x,
    //         xAxis.y, yAxis.y, zAxis.y,
    //         xAxis.z, yAxis.z, zAxis.z
    //     );

    //     let rot = rotate(userJoints[LEFTSHOULDER], userJoints[LEFTELBOW], leftElbow.position, basis);
    //     leftShoulder.quaternion.slerp(rot, SMOOTHING);
    //     updateBasis(leftShoulder.quaternion, xAxis, yAxis, zAxis, basis);

        // rot = rotate(userJoints[LEFTELBOW], userJoints[LEFTWRIST], leftWrist.position, basis);
        // leftElbow.quaternion.slerp(rot, SMOOTHING);
        // updateBasis(leftElbow.quaternion, xAxis, yAxis, zAxis, basis);

        // let leftFingersUser = userJoints[LEFTPINKY].lerp(userJoints[LEFTINDEX], 0.5);
        // let leftFingersAvatar = leftHands[PINKY1].position.clone().lerp(leftHands[INDEX1].position, 0.5);
        // rot = rotate(userJoints[LEFTWRIST], leftFingersUser, leftFingersAvatar, basis);
        // leftWrist.quaternion.slerp(rot, SMOOTHING);

        // right arm
        // xAxis = shoulderX.clone();
        // yAxis = shoulderY.clone();
        // zAxis = shoulderZ.clone();
        // xAxis = shoulderZ.clone();
        // yAxis = shoulderX.clone().negate();
        // zAxis = shoulderY.clone().negate();
        // basis = new THREE.Matrix3().set(
        //     xAxis.x, yAxis.x, zAxis.x,
        //     xAxis.y, yAxis.y, zAxis.y,
        //     xAxis.z, yAxis.z, zAxis.z
        // );

        // rot = rotate(userJoints[RIGHTSHOULDER], userJoints[RIGHTELBOW], rightElbow.position, basis);
        // rightShoulder.quaternion.slerp(rot, SMOOTHING);
        // updateBasis(rightShoulder.quaternion, xAxis, yAxis, zAxis, basis);

        // rot = rotate(userJoints[RIGHTELBOW], userJoints[RIGHTWRIST], rightWrist.position, basis);
        // rightElbow.quaternion.slerp(rot, SMOOTHING);
        // updateBasis(rightElbow.quaternion, xAxis, yAxis, zAxis, basis);

        // let rightFingersUser = userJoints[RIGHTPINKY].lerp(userJoints[RIGHTINDEX], 0.5);
        // let rightFingersAvatar = rightHands[PINKY1].position.clone().lerp(rightHands[INDEX1].position, 0.5);
        // rot = rotate(userJoints[RIGHTWRIST], rightFingersUser, rightFingersAvatar, basis);
        // rightWrist.quaternion.slerp(rot, SMOOTHING);
    // }

    // // REQUIRED: both hips must be visible to track lowerbody
    // if (rightHipVis > VISTHRESH && leftHipVis > VISTHRESH) {
    //     // hip local coordinate system
    //     // positive directions: x - leftHip -> rightHip,
    //     //                      y - hip -> shoulder,
    //     //                      z - user -> camera
    //     let hipX = userJoints[RIGHTHIP].clone().sub(userJoints[LEFTHIP]).normalize();
    //     let hipY = userJoints[RIGHTSHOULDER].clone().lerp(userJoints[LEFTSHOULDER], 0.5).normalize();   // BUG: using shoulder Y is not accurate, but don't have better way...
    //     let hipZ = hipX.clone().cross(hipY).normalize();

    //     // body direction
    //     let thetaX = Math.acos(hipZ.x);
    //     let rotY = - thetaX + Math.PI / 2;
    //     smoothRotation(skeleton, 0, rotY, 0);
    //     smoothRotation(spine, 0.2 * Math.PI / 2, -rotY, 0);

    //     // world position
    //     let LH = new THREE.Vector3(poseLandmarks[LEFTHIP].x * WIDTH, poseLandmarks[LEFTHIP].y * HEIGHT);
    //     let RH = new THREE.Vector3(poseLandmarks[RIGHTHIP].x * WIDTH, poseLandmarks[RIGHTHIP].y * HEIGHT);

    //     let percentX = LH.lerp(RH, 0.5).x / WIDTH - 0.5;
    //     skeleton.position.x = (1 - SMOOTHING) * skeleton.position.x + SMOOTHING * percentX * -1000;

    //     // TODO: z direction movement
    //     // let shoulderLen = LH.distanceTo(RH);
    //     // let angleY = Math.atan2(shoulderX.z, shoulderX.x);
    //     // shoulderLen /= Math.abs(Math.cos(angleY));  // BUG: division by 0
    //     // let precentZ = interpolate(shoulderLen, 550, 150);
    //     // skeleton.position.z = precentZ * -1000;

    //     // left leg
    //     let xAxis = hipX.clone();
    //     let yAxis = hipY.clone();
    //     let zAxis = hipZ.clone();
    //     let basis = new THREE.Matrix3().set(
    //         xAxis.x, yAxis.x, zAxis.x,
    //         xAxis.y, yAxis.y, zAxis.y,
    //         xAxis.z, yAxis.z, zAxis.z
    //     );

    //     let rot = rotate(userJoints[LEFTHIP], userJoints[LEFTKNEE], leftKnee.position, basis);
    //     leftHip.quaternion.slerp(rot, SMOOTHING);
    //     updateBasis(leftHip.quaternion, xAxis, yAxis, zAxis, basis);

    //     rot = rotate(userJoints[LEFTKNEE], userJoints[LEFTANKLE], leftAnkle.position, basis);
    //     leftKnee.quaternion.slerp(rot, SMOOTHING);
    //     updateBasis(leftKnee.quaternion, xAxis, yAxis, zAxis, basis);

    //     rot = rotate(userJoints[LEFTANKLE], userJoints[LEFTFOOT], leftFoot.position, basis);
    //     leftAnkle.quaternion.slerp(rot, SMOOTHING);

    //     // right leg
    //     xAxis = hipX.clone();
    //     yAxis = hipY.clone();
    //     zAxis = hipZ.clone();
    //     basis = new THREE.Matrix3().set(
    //         xAxis.x, yAxis.x, zAxis.x,
    //         xAxis.y, yAxis.y, zAxis.y,
    //         xAxis.z, yAxis.z, zAxis.z
    //     );

    //     rot = rotate(userJoints[RIGHTHIP], userJoints[RIGHTKNEE], rightKnee.position, basis);
    //     rightHip.quaternion.slerp(rot, SMOOTHING);
    //     updateBasis(rightHip.quaternion, xAxis, yAxis, zAxis, basis);

    //     rot = rotate(userJoints[RIGHTKNEE], userJoints[RIGHTANKLE], rightAnkle.position, basis);
    //     rightKnee.quaternion.slerp(rot, SMOOTHING);
    //     updateBasis(rightKnee.quaternion, xAxis, yAxis, zAxis, basis);

    //     rot = rotate(userJoints[RIGHTANKLE], userJoints[RIGHTFOOT], rightFoot.position, basis);
    //     rightAnkle.quaternion.slerp(rot, SMOOTHING);
    // } else {
    //     // reset legs
    //     leftHip.quaternion.identity();
    //     leftKnee.quaternion.identity();
    //     leftAnkle.quaternion.identity();
    //     rightHip.quaternion.identity();
    //     rightKnee.quaternion.identity();
    //     rightAnkle.quaternion.identity();
    // }
}

export function setFingers(handLandmarks, isRight) {
    let avatars = (isRight) ? rightHands : leftHands;

    // hand landmark positions
    let userJoints = [];
    handLandmarks.forEach((landmark) => {
        userJoints.push(new THREE.Vector3(landmark.x * WIDTH, -landmark.y * HEIGHT, landmark.z * WIDTH));
    });

    // hand local coordinate system
    // positive directions: x - fingers -> wrist,
    //                      y - back of hand -> world
    //                      z - pinky -> thumb
    let handX = userJoints[WRIST].clone().sub(userJoints[MIDDLE1]).normalize();
    if (isRight) handX.negate();
    let handZ = userJoints[INDEX1].clone().sub(userJoints[RING1]).normalize();
    let handY = handX.clone().cross(handZ).normalize();
    if (!isRight) handY.negate();

    let handBasis = new THREE.Matrix3().set(
        handX.x, handY.x, handZ.x,
        handX.y, handY.y, handZ.y,
        handX.z, handY.z, handZ.z
    );

    // thumb
    let xAxis = handX.clone();
    let yAxis = handY.clone();
    let zAxis = handZ.clone();
    let basis = handBasis.clone();

    // iterate thumb joints
    for (let i = 1; i < 4; i++) {
        let rot = rotate(userJoints[i], userJoints[i + 1], avatars[i + 1].position, basis);       
        let angles = new THREE.Euler().setFromQuaternion(rot.normalize());

        // constrain finger rotation to x-axis, range [0, 90] degrees
        let angleX = angles.toVector3().length();
        angleX = Math.max(0, angleX);
        angleX = Math.min(Math.PI / 2, angleX);
        
        if (isRight) smoothRotation(avatars[i], angleX - 0.2 * Math.PI, 0, 0);
        else smoothRotation(avatars[i], angleX, 0, 0);

        updateBasis(avatars[i].quaternion, xAxis, yAxis, zAxis, basis);
    }

    // iterate fingers
    for (let i = 5; i <= 17; i += 4) {
        xAxis = handX.clone();
        yAxis = handY.clone();
        zAxis = handZ.clone();
        basis = handBasis.clone();

        // iterate finger joints
        for (let j = i; j < i + 3; j++) {
            let rot = rotate(userJoints[j], userJoints[j + 1], avatars[j + 1].position, basis);
            
            // constrain finger rotation to z-axis, range [0, 90] degrees
            let angleZ = new THREE.Euler().setFromQuaternion(rot.normalize()).z;
            angleZ = Math.max(0, angleZ);
            angleZ = Math.min(Math.PI / 2, angleZ)

            if (isRight) smoothRotation(avatars[j], 0, 0, -angleZ);
            else smoothRotation(avatars[j], 0, 0, angleZ);

            updateBasis(avatars[j].quaternion, xAxis, yAxis, zAxis, basis);
        }
    }
}

export function setMorphs(faceLandmarks) {
    if (!morphTargets) return;

    // PROCESS LANDMARKS

    // center of head
    let pL = new THREE.Vector3(faceLandmarks[LEFT].x * WIDTH, faceLandmarks[LEFT].y * HEIGHT, faceLandmarks[LEFT].z * WIDTH);
    let pR = new THREE.Vector3(faceLandmarks[RIGHT].x * WIDTH, faceLandmarks[RIGHT].y * HEIGHT, faceLandmarks[RIGHT].z * WIDTH);
    let pM = pL.lerp(pR, 0.5);

    // width and height of face
    let pT = new THREE.Vector3(faceLandmarks[TOP].x * WIDTH, faceLandmarks[TOP].y * HEIGHT, faceLandmarks[TOP].z * WIDTH);
    let pB = new THREE.Vector3(faceLandmarks[BOT].x * WIDTH, faceLandmarks[BOT].y * HEIGHT, faceLandmarks[BOT].z * WIDTH);
    let faceLenX = pR.distanceTo(pL);
    let faceLenY = pB.distanceTo(pT);

    // face plane origin
    let pN = new THREE.Vector3(faceLandmarks[NOSE].x * WIDTH, faceLandmarks[NOSE].y * HEIGHT, faceLandmarks[NOSE].z * WIDTH);

    // unit normal, face plane z-axis
    let zAxis = pN.clone().sub(pM);
    zAxis.normalize();

    // project nasal onto face plane
    let pNas = new THREE.Vector3(faceLandmarks[NASAL].x * WIDTH, faceLandmarks[NASAL].y * HEIGHT, faceLandmarks[NASAL].z * WIDTH);
    let v = pNas.clone().sub(pN);
    let dist = zAxis.dot(v);
    pNas.sub(zAxis.clone().multiplyScalar(dist));

    // face plane y-axis
    let yAxis = pNas.sub(pN);
    yAxis.normalize();

    // face plane x-axis
    let xAxis = zAxis.clone().cross(yAxis);
    xAxis.normalize();
    xAxis.negate();

    // gaze direction
    let thetaX = Math.acos(zAxis.x);
    let thetaY = Math.acos(zAxis.y);
    let thetaZ = Math.acos(yAxis.x);
    let rotX = -(thetaY - Math.PI / 2) - 0.1 * Math.PI;
    let rotY = thetaX - Math.PI / 2;
    let rotZ = -(thetaZ - Math.PI / 2);
    smoothRotation(neck, rotX, rotY, rotZ);

    if (isMixamo) {
        // face plane local coordinates (pX, pY)
        let facePos = [];
        for (let landmark of faceLandmarks) {
            let p = new THREE.Vector3(landmark.x * WIDTH, landmark.y * HEIGHT, landmark.z * WIDTH);

            // project point onto face plane
            v = p.sub(pN);
            let pX = xAxis.dot(v) / faceLenX;
            let pY = yAxis.dot(v) / faceLenY;
            facePos.push([pX, pY]);
        }

        // CALCULATE MORPHS

        // eyes
        let eyeRT = facePos[27];
        let eyeRB = facePos[23];
        let eyeLT = facePos[257];
        let eyeLB = facePos[253];

        let min = 0.1;
        let max = 0.12;
        setMorphTarget("EyesWide_Left", interpolate(eyeRT[1] - eyeRB[1], min, max));
        setMorphTarget("EyesWide_Right", interpolate(eyeLT[1] - eyeLB[1], min, max));

        max = 0.095;
        setMorphTarget("Squint_Left", interpolate(eyeRT[1] - eyeRB[1], min, max));
        setMorphTarget("Squint_Right", interpolate(eyeLT[1] - eyeLB[1], min, max));

        max = 0.09;
        setMorphTarget("Blink_Left", interpolate(eyeRT[1] - eyeRB[1], min, max));
        setMorphTarget("Blink_Right", interpolate(eyeLT[1] - eyeLB[1], min, max));

        // eyebrows
        let browR = facePos[66];
        let browL = facePos[296];

        min = 0.35;
        max = 0.4;
        setMorphTarget("BrowsUp_Left", interpolate(browR[1], min, max));
        setMorphTarget("BrowsUp_Right", interpolate(browL[1], min, max));

        max = 0.33;
        setMorphTarget("BrowsDown_Left", interpolate(browR[1], min, max));
        setMorphTarget("BrowsDown_Right", interpolate(browL[1], min, max));

        // mouth
        let mouthT = facePos[13];
        let mouthB = facePos[14];
        let mouthL = facePos[308];
        let mouthR = facePos[78];

        min = 0.01;
        max = 0.15;
        setMorphTarget("MouthOpen", interpolate(mouthT[1] - mouthB[1], min, max));

        min = -0.15;
        max = -0.11;
        setMorphTarget("Midmouth_Right", interpolate(mouthR[0], min, max));
        setMorphTarget("Midmouth_Left", interpolate(mouthL[0], -min, -max));

        min = -0.22;
        max = -0.25;
        setMorphTarget("Frown_Left", interpolate(mouthR[1], min, max));
        setMorphTarget("Frown_Right", interpolate(mouthL[1], min, max));

        max = -0.18;
        setMorphTarget("Smile_Left", interpolate(mouthR[1], min, max));
        setMorphTarget("Smile_Right", interpolate(mouthL[1], min, max));

        // nose
        let noseR = facePos[129];
        let noseL = facePos[358];

        min = -0.027;
        max = -0.018;
        setMorphTarget("NoseScrunch_Left", interpolate(noseR[1], min, max));
        setMorphTarget("NoseScrunch_Right", interpolate(noseL[1], min, max));
    }
}

export function setBlendshapes(blendshapeDict) {
    for (const [key, value] of blendshapeDict) {
        let blendshape = key;

        let tokens = key.split("_");
        if (tokens.length > 1) {
            switch (tokens[1]) {
                case "L":
                    blendshape = tokens[0] + 'Right';
                    break;
                case "R":
                    blendshape = tokens[0] + 'Left';
                    break;
                default:
                    console.log("Unknown Blendshape");
            }
        }

        morphTargets[morphDict[blendshape]] = value;
    }
}

// motion smoothing rotation of object by x, y, z
function smoothRotation(object, rotX, rotY, rotZ) {
    // interpolate with current values to prevent jittering
    let SMOOTHING = 0.25;
    if (rotX != 0) object.rotation.x = (1 - SMOOTHING) * object.rotation.x + SMOOTHING * rotX;
    if (rotY != 0) object.rotation.y = (1 - SMOOTHING) * object.rotation.y + SMOOTHING * rotY;
    if (rotZ != 0) object.rotation.z = (1 - SMOOTHING) * object.rotation.z + SMOOTHING * rotZ;
}

// userJoint (Vector3) - world position of joint
// userChild (Vector3) - world position of child of joint
// avatarChild (Vector3) - local position of child bone of joint
// basis (Matrix3) - local axes at joint (in world coordinates)
// returns rotation needed at joint
function rotate(userJoint, userChild, avatarChild, basis) {
    // change of basis: world -> local
    let userLimb = userChild.clone().sub(userJoint).applyMatrix3(basis.invert()).normalize();
    let avatarLimb = avatarChild.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(avatarLimb, userLimb);
}

// applies rotation to basis
function updateBasis(rotation, xAxis, yAxis, zAxis, basis) {
    xAxis.applyQuaternion(rotation);
    yAxis.applyQuaternion(rotation);
    zAxis.applyQuaternion(rotation);
    basis.set(
        xAxis.x, yAxis.x, zAxis.x,
        xAxis.y, yAxis.y, zAxis.y,
        xAxis.z, yAxis.z, zAxis.z
    );
}

// returns linear interpolation of val between min and max
// (percentage that val is between min and max)
function interpolate(val, min, max) {
    let result = (val - min) / (max - min);

    if (result < 0) return 0;
    else if (result > 1) return 1;
    else return result;
}

function setMorphTarget(target, val) {
    // interpolate with previous value to prevent jittering
    let SMOOTHING = 0.25;
    morphTargets[morphDict[target]] = (1 - SMOOTHING) * morphTargets[morphDict[target]] + SMOOTHING * val;
}
