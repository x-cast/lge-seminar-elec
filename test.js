function Record_Cast() {
    let serverHandler, janus, janus_server_socket;
    let bitrate = 1600000
    lstream = null;
    let room_id, unique_id, opaqueId, error;

    this.init = function (stream, u_ID, roomid) {
        janus_server_socket = "wss://lgtrans.hdmania.com/ws";
        unique_id = u_ID;
        room_id = roomid; //*1;
        lstream = stream;
        init_Janus_for_broadcast();
    };

    function init_Janus_for_broadcast() {
        console.log("start record");
        Janus.init({
            debug: "all",
            callback: function () {
                if (!Janus.isWebrtcSupported()) {
                    bootbox.alert("No WebRTC support... ");
                    return;
                }
                // Create session
                janus = new Janus({
                    server: janus_server_socket,
                    success: function () {
                        // Attach to video room test plugin
                        janus.attach({
                            plugin: "janus.plugin.recordplay",
                            opaqueId: opaqueId,
                            success: function (pluginHandle) {
                                serverHandler = pluginHandle;
                                serverHandler.send({
                                    message: {
                                        request: "configure",
                                        "video-bitrate-max": bitrate, // a quarter megabit
                                        "video-keyframe-interval": 60000, // 15 seconds
                                    },
                                });
                                createOffer();
                            },
                            error: function (error) {
                                Janus.error("  -- Error attaching plugin...", error);
                                console.log(error);
                                error_callback(error);
                            },
                            mediaState: function (medium, on) {
                                Janus.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
                            },
                            onmessage: function (msg, jsep) {
                                Janus.debug(" ::: Got a message (publisher) :::");
                                Janus.debug(msg);
                                console.log(msg);
                                var event = msg["videoroom"];
                                Janus.debug("Event: " + event);
                                if (event != undefined && event != null) {
                                    if (event === "preparing" || event === "refreshing") {
                                        Janus.log("Successfully joined room " + msg["room"]);
                                    } else if (event === "destroyed") {
                                        // The room has been destroyed
                                        error_callback(error);
                                        Janus.warn("The room has been destroyed!");
                                    }
                                }
                                if (jsep !== undefined && jsep !== null) {
                                    Janus.debug("Handling SDP as well...");
                                    serverHandler.handleRemoteJsep({
                                        jsep: jsep,
                                    });
                                }
                            },
                            oncleanup: function () {
                                Janus.log(" ::: Got a cleanup notification: we are unpublished now :::");
                                local_stream = null;
                            },
                        });
                    },
                    error: function (error) {
                        Janus.error(error);
                        error_callback(error);
                    },
                });
            },
        });
    }

    function createOffer() {
        serverHandler.createOffer({
            // Add data:true here if you want to publish datachannels as well
            media: {
                audioSend: true,
                videoSend: true,
            },
            tracks: [{ type: "video", capture: lstream.getVideoTracks()[0] }, { type: "audio", capture: lstream.getAudioTracks()[0] }],
            simulcast: false,
            success: function (jsep) {
                var body = { request: "record", name: room_id + "", id: unique_id * 1 };
                serverHandler.send({
                    message: body,
                    jsep: jsep,
                });
            },
            error: function (error) {
                error_callback({ type: 99, msg: "WebRTC error... " + error });
            },
        });
    }

    function error_callback(error) {
        $(".recording.toggle").attr("src", "/live/img/icon_recording_off.svg");
        $(".recording.amin").hide();
        if (janus) {
            janus.destroy();
            janus = null;
        }
        if (lstream && lstream.getVideoTracks()) {
            lstream.getVideoTracks().forEach(track => track.stop());
        }
        console.log(error)
        // Swal.fire({
        //     heightAuto: false,
        //     title: "오류",
        //     text: "오류로 인해 녹화가 실패하였습니다",
        //     dangerMode: true,
        // });
    }

    this.destroy = function () {
        if (janus) {
            janus.destroy();
            janus = null;
        }
        if (lstream && lstream.getVideoTracks()) {
            lstream.getVideoTracks().forEach(track => track.stop());
        }

        $(".recording.toggle").attr("src", "/live/img/icon_recording_off.svg");
        $(".recording.amin").hide();
        //if(lstream){lstream.getTracks().forEach(track => track.stop());}
    };
}
