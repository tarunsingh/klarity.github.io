$(function() {
    // Code here
    console.log('here');
    function scrollChatToBottom() {
        let objDiv = document.getElementById("history");
        objDiv.scrollTop = objDiv.scrollHeight;
    }
    scrollChatToBottom();
});
