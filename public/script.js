const socket = io();

const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.stunprotocol.org",
    },
  ],
});

const createCall = async (to) => {
  const status = document.getElementById("status");
  status.innerText = `Calling ${to}`;

  const localOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localOffer));

  socket.emit("outgoing:call", { fromOffer: localOffer, to });
};

peer.ontrack = async ({ streams: [stream] }) => {
  const status = document.getElementById("status");
  status.innerText = "Incomming Stream";

  console.log(stream);

  const video = document.getElementById("remote-video");
  video.srcObject = stream;
  video.play();

  const mySteam = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  for (const track of mySteam.getTracks()) {
    peer.addTrack(track, mySteam);
  }
};

socket.on("users:joined", (id) => {
  const usersDiv = document.getElementById("users");
  const btn = document.createElement("button");
  const textNode = document.createTextNode(id);

  btn.id = id;

  btn.setAttribute("onclick", `createCall('${id}')`);
  btn.appendChild(textNode);
  usersDiv.appendChild(btn);
});

socket.on("incomming:answere", async (data) => {
  const status = document.getElementById("status");
  status.innerText = "incomming:answere";

  const { offer } = data;
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
});

socket.on("user:disconnect", (id) => {
  document.getElementById(id).remove();
});

socket.on("incomming:call", async (data) => {
  const status = document.getElementById("status");
  status.innerText = "incomming:call";

  const { from, offer } = data;

  await peer.setRemoteDescription(new RTCSessionDescription(offer));

  const answereOffer = await peer.createAnswer();
  await peer.setLocalDescription(new RTCSessionDescription(answereOffer));

  socket.emit("call:accepted", { answere: answereOffer, to: from });
  const mySteam = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  for (const track of mySteam.getTracks()) {
    peer.addTrack(track, mySteam);
  }
});

const getAndUpdateUsers = async () => {
  const usersDiv = document.getElementById("users");
  usersDiv.innerHTML = "";

  const response = await fetch("/users", { method: "GET" });
  const jsonResponse = await response.json();

  console.log(jsonResponse);

  jsonResponse.forEach((user) => {
    const btn = document.createElement("button");
    const textNode = document.createTextNode(user[0]);

    btn.id = user[0];

    btn.setAttribute("onclick", `createCall('${user[0]}')`);
    btn.appendChild(textNode);
    usersDiv.appendChild(btn);
  });
};

socket.on(
  "hello",
  ({ id }) => (document.getElementById("myId").innerText = id)
);

const getUserMedia = async () => {
  const userMedia = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  const videoEle = document.getElementById("local-video");
  videoEle.srcObject = userMedia;
  videoEle.play();
};

window.addEventListener("load", getAndUpdateUsers);
window.addEventListener("load", getUserMedia);
