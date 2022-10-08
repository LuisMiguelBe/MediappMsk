import * as THREE from 'three';

import { skeleton, spine, neckBone, leftShoulderBone, leftElbowBone, leftWristBone, rightShoulderBone, rightElbowBone, rightWristBone, leftHipBone, leftKneeBone, leftAnkleBone, leftFootBone, rightHipBone, rightKneeBone, rightAnkleBone, rightFootBone, leftHandBones, rightHandBones } from './avatar';

// tgtAvatar - ReadyPlayerMe
export function retarget(tgtAvatar) {
    let Skeleton = tgtAvatar.getObjectByName("Hips");
    let Spine = tgtAvatar.getObjectByName("Spine");
    let Neck = Skeleton.getObjectByName("Head");

    let LClavicle = Skeleton.getObjectByName("RightShoulder");
    let LShoulder = LClavicle.getObjectByName("RightArm");
    let LElbow = LShoulder.getObjectByName("RightForeArm");
    let LWrist = LElbow.getObjectByName("RightHand");
    let RShoulder = Skeleton.getObjectByName("LeftArm");
    let RElbow = RShoulder.getObjectByName("LeftForeArm");
    let RWrist = RElbow.getObjectByName("LeftHand");

    let LHip = Skeleton.getObjectByName("RightUpLeg");
    let LKnee = LHip.getObjectByName("RightLeg");
    let LAnkle = LKnee.getObjectByName("RightFoot");
    let LFoot = LAnkle.getObjectByName("RightToe_End");
    let RHip = Skeleton.getObjectByName("LeftUpLeg");
    let RKnee = RHip.getObjectByName("LeftLeg");
    let RAnkle = RKnee.getObjectByName("LeftFoot");
    let RFoot = RAnkle.getObjectByName("LeftToe_End");

    let LHands = [
        LWrist,
        LWrist.getObjectByName("RightHandThumb1"),
        LWrist.getObjectByName("RightHandThumb2"),
        LWrist.getObjectByName("RightHandThumb3"),
        LWrist.getObjectByName("RightHandThumb4"),
        LWrist.getObjectByName("RightHandIndex1"),
        LWrist.getObjectByName("RightHandIndex2"),
        LWrist.getObjectByName("RightHandIndex3"),
        LWrist.getObjectByName("RightHandIndex4"),
        LWrist.getObjectByName("RightHandMiddle1"),
        LWrist.getObjectByName("RightHandMiddle2"),
        LWrist.getObjectByName("RightHandMiddle3"),
        LWrist.getObjectByName("RightHandMiddle4"),
        LWrist.getObjectByName("RightHandRing1"),
        LWrist.getObjectByName("RightHandRing2"),
        LWrist.getObjectByName("RightHandRing3"),
        LWrist.getObjectByName("RightHandRing4"),
        LWrist.getObjectByName("RightHandPinky1"),
        LWrist.getObjectByName("RightHandPinky2"),
        LWrist.getObjectByName("RightHandPinky3"),
        LWrist.getObjectByName("RightHandPinky4")
    ]

    let RHands = [
        RWrist,
        RWrist.getObjectByName("LeftHandThumb1"),
        RWrist.getObjectByName("LeftHandThumb2"),
        RWrist.getObjectByName("LeftHandThumb3"),
        RWrist.getObjectByName("LeftHandThumb4"),
        RWrist.getObjectByName("LeftHandIndex1"),
        RWrist.getObjectByName("LeftHandIndex2"),
        RWrist.getObjectByName("LeftHandIndex3"),
        RWrist.getObjectByName("LeftHandIndex4"),
        RWrist.getObjectByName("LeftHandMiddle1"),
        RWrist.getObjectByName("LeftHandMiddle2"),
        RWrist.getObjectByName("LeftHandMiddle3"),
        RWrist.getObjectByName("LeftHandMiddle4"),
        RWrist.getObjectByName("LeftHandRing1"),
        RWrist.getObjectByName("LeftHandRing2"),
        RWrist.getObjectByName("LeftHandRing3"),
        RWrist.getObjectByName("LeftHandRing4"),
        RWrist.getObjectByName("LeftHandPinky1"),
        RWrist.getObjectByName("LeftHandPinky2"),
        RWrist.getObjectByName("LeftHandPinky3"),
        RWrist.getObjectByName("LeftHandPinky4")
    ]

    // left arm
    let srcAngles = leftShoulderBone.rotation;
    let angle = 90;
    let x = constrainAngle(srcAngles.z, -angle, angle);
    let y = constrainAngle(srcAngles.x, -angle, angle);
    let z = constrainAngle(-srcAngles.y, -angle, angle);
    LShoulder.setRotationFromEuler(new THREE.Euler(x, y, z, 'XYZ'));

    srcAngles = leftElbowBone.rotation;
    x = constrainAngle(srcAngles.z, -angle, angle);
    y = constrainAngle(srcAngles.x, -angle, angle);
    z = constrainAngle(-srcAngles.y, -angle, angle);
    LElbow.setRotationFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
    // srcAngles = leftWristBone.rotation;
    // LWrist.setRotationFromEuler(new THREE.Euler(srcAngles.z, srcAngles.x, -srcAngles.y, 'XYZ'));

    // // left thumb
    // for (let i = 2; i < 5; i++) {
    //     srcAngles = leftHandBones[i].rotation;
    //     LHands[i].setRotationFromEuler(new THREE.Euler(0, 0, srcAngles.x, 'XYZ'));
    // }

    // // left fingers
    // for (let i = 5; i < LHands.length; i++) {
    //     srcAngles = leftHandBones[i].rotation;
    //     LHands[i].setRotationFromEuler(new THREE.Euler(srcAngles.z, 0, 0, 'XYZ'));
    // }

    // // right arm
    // srcAngles = rightShoulderBone.rotation;
    // RShoulder.setRotationFromEuler(new THREE.Euler(-srcAngles.z, -srcAngles.x, -srcAngles.y, 'XYZ'));
    // srcAngles = rightElbowBone.rotation;
    // RElbow.setRotationFromEuler(new THREE.Euler(-srcAngles.z, -srcAngles.x, -srcAngles.y, 'XYZ'));
    // srcAngles = rightWristBone.rotation;
    // RWrist.setRotationFromEuler(new THREE.Euler(-srcAngles.z, -srcAngles.x, -srcAngles.y, 'XYZ'));

    // // right thumb
    // for (let i = 2; i < 5; i++) {
    //     srcAngles = rightHandBones[i].rotation;
    //     RHands[i].setRotationFromEuler(new THREE.Euler(0, 0, -srcAngles.x, 'XYZ'));
    // }

    // // right fingers
    // for (let i = 5; i < RHands.length; i++) {
    //     srcAngles = rightHandBones[i].rotation;
    //     RHands[i].setRotationFromEuler(new THREE.Euler(-srcAngles.z, 0, 0, 'XYZ'));
    // }
}

function constrainAngle(angle, low, high) {
    angle = angle * 180 / Math.PI;

    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;

    angle = Math.max(low, Math.min(high, angle));

    return angle * Math.PI / 180;
}