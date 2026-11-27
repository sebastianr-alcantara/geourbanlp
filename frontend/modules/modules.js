const btnLogout = document.getElementById("btn-logout");

function logout() {

    window.location.href = "../../index.html";
}


function initializeModules() {

    if (btnLogout) {
        btnLogout.addEventListener(
            "click",
            logout
        );
    }
}


initializeModules();