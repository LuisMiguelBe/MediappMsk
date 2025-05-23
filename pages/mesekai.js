import React, { useEffect, useRef } from "react";
import { Button, Row, Col, Spin, Tabs } from "antd";
import { LoadingOutlined } from '@ant-design/icons';

import styles from '../styles/Mesekai.module.css'
import { init, animate, updateAvatar, updateWorld } from "../src/scene";
import { PoseDetector } from "../src/mediapipe";

const { TabPane } = Tabs;
const antIcon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export default function Avatar() {
    const preload = useRef();
    const canvas = useRef();
    const videoInput = useRef();

    useEffect(() => {
        // TODO: get authenticated user
        //let currUser = sessionStorage.getItem('user');
        let currUser = null;

        init(canvas.current, currUser);
        animate();

        const [detector, camera] = PoseDetector(
            preload.current,
            videoInput.current
        );

        camera.start();

        return function cleanup() {
            detector.close();
            camera.stop();
        };
    });

    return (
        <div id="mesekai">
            <Row>
                <Col span={4}>
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Avatars" key="1" type="card" >
                            <Button style={{background: `url('thumbnails/avatar/xbot.png')`,
                                            backgroundPosition: 'center'}} 
                                    onClick={updateAvatar.bind(this, "xbot")}>
                            X Bot
                            </Button>
                           
                        </TabPane>
                    </Tabs>
                </Col>
                <Col span={20}>
                    <div ref={canvas}></div>
                    <video hidden ref={videoInput} width="1920px" height="1080px"></video>
                </Col>
            </Row>

            <h1 ref={preload}><span className={styles.loadingtext}> Loading Avatar Tracking <Spin indicator={antIcon}/></span></h1>
        </div>
    );
}
