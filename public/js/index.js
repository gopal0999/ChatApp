let joinUserForm = document.getElementById("joinUser")
let userNameElement = document.getElementById("username")

joinUserForm.onsubmit = function(){
    localStorage.setItem("username",userNameElement.value)
}