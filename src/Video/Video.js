import "./Video.css";
import AgoraRTC from "agora-rtc-sdk";
import AgoraSignal from "../AgoraSig-1.4.0";
import Controls from '../Controls/Controls'

let remoteContainer = document.getElementById("remote");
let remoteMinimized = document.getElementById("minimized-remote");
let remotes = [];
let chatChannel = null;
let recognition = null;
/**
 * @name addVideoStream
 * @param streamId
 * @description Helper function to add the video stream to "remote-container"
 */
function addVideoStream(streamId) {
  remotes.push(streamId);
  let streamDiv = document.createElement("div"); // Create a new div for every stream
  streamDiv.id = String(streamId); // Assigning id to div
  streamDiv.style.transform = "rotateY(180deg)"; // Takes care of lateral inversion (mirror image)
  if (remotes.length > 1) {
    streamDiv.className = "minimized-video video-margin";
    remoteMinimized.appendChild(streamDiv); // Add new div to container
  } else {
    streamDiv.style.height = "100%";
    remoteContainer.appendChild(streamDiv); // Add new div to container
  }
}

/**
 * @name removeVideoStream
 * @param evt - Remove event
 * @description Helper function to remove the video stream from "remote-container"
 */
function removeVideoStream(evt) {
  console.log("remove video-stream called");
  let stream = evt.stream;
  if (stream) {
    stream.close();
    remotes = remotes.filter(e => e !== stream.getId());
    // console.log('remove ',stream.getId(), remotes);
    let remDiv = document.getElementById(stream.getId());
    remDiv.parentNode.removeChild(remDiv);
    console.log("Remote stream is removed " + stream.getId());
  }
}

/**
 * @name handleFail
 * @param err - error thrown by any function
 * @description Helper function to handle errors
 */
let handleFail = function(err) {
  console.log("Error : ", err);
};

function signalInit() {
  const signalClient = AgoraSignal("3e30ad81f5ab46f685143d81f0666c6f");
  const queryString = location.search.split("=");
  const name = queryString[1] ? queryString[1] : "unknownuser";
  const session = signalClient.login(name, "_no_need_token");
  session.onLoginSuccess = function(uid) {
    /* Join a channel. */
    var channel = session.channelJoin("abcd");
    channel.onChannelJoined = function() {
      chatChannel = channel;
      channel.onMessageChannelReceive = function(account, uid, msg) {
        // if (account === name) return;
        console.log(account, uid, msg);

      };
      /* Send a channel message. */
      // channel.messageChannelSend("hello");
      /* Logout of the system. */
      // session.logout();
    };
  };
  session.onLogout = function(ecode) {
    /* Set the onLogout callback. */
  };
}

/**
 * @name handleFail
 * @param client - RTC Client
 * @description Function takes in a client and returns a promise which will resolve {localStream and client}
 */
export default function video(client) {
  signalInit();
  let resolve;
  client.init(
    "3e30ad81f5ab46f685143d81f0666c6f",
    function() {
      console.log("AgoraRTC client initialized");
    },
    function(err) {
      console.log("AgoraRTC client init failed", err);
    }
  );
  // Start coding here
  client.join(
    "3e30ad81f5ab46f685143d81f0666c6f",
    "abcd",
    null,
    function(uid) {
      
      const localStream = AgoraRTC.createStream({
        streamID: uid,
        audio: true,
        video: true,
        screen: false
      });
      localStream.init(
        function() {
          console.log("getUserMedia successfully");
          localStream.play("me");
          recognition = new webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.lang = "en-IN";
          recognition.interimResults = true;
          startTranscribe();
          Controls({localStream: localStream, recognition: recognition, client: client});
          client.publish(localStream, function(err) {
            console.log("Publish local stream error: " + err);
          });
        },
        function(err) {
          console.log("getUserMedia failed", err);
        }
      );
      console.log("User " + uid + " join channel successfully");
      client.on("stream-published", function(evt) {
        console.log("Publish local stream successfully");
      });

      client.on("stream-added", function(evt) {
        var stream = evt.stream;
        console.log("New stream added: " + stream.getId());

        client.subscribe(stream, function(err) {
          console.log("Subscribe stream failed", err);
        });
      });
      client.on("stream-subscribed", function(evt) {
        var remoteStream = evt.stream;
        console.log(
          "Subscribe remote stream successfully: " + remoteStream.getId()
        );
        // remoteStream.play('remote' + remoteStream.getId());
        remoteStream.play("remote");
      });
    },
    function(err) {
      console.log("Join channel failed", err);
    }
  );
  return new Promise((res, rej) => {
    resolve = res;
  });
}


function startTranscribe() {

  recognition.onstart = function() {
    console.info('started recognition');
  };

  recognition.onerror = function(event) {
    console.error(event.error);
  };

  recognition.onresult = function(event) {
    console.log(event);
    var interim_transcript = '';
    var final_transcript = '';
    if (typeof(event.results) == 'undefined') {
      recognition.onend = null;
      recognition.stop();
      upgrade();
      return;
    }
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    if (!chatChannel) return;
    chatChannel.messageChannelSend(JSON.stringify({
      resultIndex: event.resultIndex,
      final_transcript: final_transcript,
      interim_transcript: interim_transcript,
    }));

  };
  recognition.start();
}