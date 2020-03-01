var origLog = console.log
console.log = function (message) {
  origLog(message)
  var msgbox = document.querySelector("#DEBUGTEXT")
  var txt = (typeof message != 'undefined') ? message.toString() : "undefined"
  if (typeof Error != 'undefined' && typeof (new Error().stack) != 'undefined') {
    var stackTxt = new Error("Stack: ").stack.toString()
    origLog(stackTxt)
    txt += "<br>" + stackTxt
  }
  msgbox.innerHTML = txt + "<br>" + msgbox.innerHTML
}

window.onerror = function (e) {
  console.log("Window error: " + e)
}

function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
 }