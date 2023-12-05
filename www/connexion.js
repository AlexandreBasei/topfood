const config = {
    apiKey: "AIzaSyC3FPfmxrdekpCizVIMW9KCRqC0NiyVyEs",
    authDomain: "topfood-391d9.firebaseapp.com",
    databaseURL: "https://topfood-391d9-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "topfood-391d9",
    storageBucket: "topfood-391d9.appspot.com",
    messagingSenderId: "850223433184",
    appId: "1:850223433184:web:c1ef8c3a4bfeecd1251785",
    measurementId: "G-N1NFJT7FV2"
};

const logIn = (event) => {
    event.preventDefault();
    let login = document.getElementById("login").value;
    let password = document.getElementById("password").value;
    firebase.auth().signInWithEmailAndPassword(login, password).catch((error) => {
        let errorCode = error.code;
        let errorMessage = error.message;
        // une erreur est survenue dans l’authentification
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                // console.log("connecté !");
                document.querySelector("#connexion p").textContent = "";
                return firebase.auth().signInWithEmailAndPassword(login, password);
            })
            .catch((error) => {
                let errorCode = error.code;
                let errorMessage = error.message;
                document.querySelector("#connexion p").style.color = "red";
                document.querySelector("#connexion p").textContent = "Adresse email ou mot de passe incorrects";
                // une erreur est survenue dans la persistence
            });
    });
}

const signIn = (event) => {
    event.preventDefault();
    let mail = document.querySelector("#mail").value;
    let logPassword = document.querySelector("#logPassword").value;
    firebase.auth().createUserWithEmailAndPassword(mail, logPassword)
        .then(() => {
            document.querySelector("#inscription p").style.color = "green";
            document.querySelector("#inscription p").textContent = "Inscription réussie !";
        })
        .catch((error) => {
            let errorCode = error.code;
            let errorMessage = error.message;
            document.querySelector("#inscription p").style.color = "red";
            document.querySelector("#inscription p").textContent = "Une erreur est survenue lors de l'inscription";
            // une erreur est survenue
        })
}

firebase.initializeApp(config);
let database = firebase.database();

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // L'utilisateur est connecté
        let userId = user.uid;
        let ref = firebase.database().ref("users/" + userId);

        ref.once('value', (snapshot) => {

            if (snapshot.exists() == false) {
                ref.set({
                    name: 'Utilisateur',
                    desc: 'Bienvenue sur mon profil !',
                    posts: 0,
                    followers: 0,
                })
                let storageRef = firebase.storage().ref();
                const originalPath = 'defaultpp.svg';

                // Assume that 'duplicatePath' is the desired path for the duplicated image
                const duplicatePath = 'users/' + userId;

                // Reference to the original image
                const originalRef = firebase.storage().ref().child(originalPath);
                const duplicateRef = firebase.storage().ref().child(duplicatePath);

                originalRef
                    .getDownloadURL()
                    .then(originalDownloadURL => {
                        return fetch(originalDownloadURL);
                    })
                    .then(response => response.blob())
                    .then(blob => {
                        // Upload the blob to the duplicate path
                        return duplicateRef.put(blob);
                    })
                    .then(snapshot => {
                        console.log('Image duplicated successfully!');
                    })
                    .catch(error => {
                        console.error('Error duplicating image:', error);
                    });
            }
        })

        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + userId);

        imageRef.getDownloadURL().then((url) => {
            // Utilisez l'URL de téléchargement ici
            let profile = document.getElementById('profile');
            profile.style.backgroundImage = "url(" + url + ")";
        }).catch((error) => {
            console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
        });

        document.getElementById("log").style.display = "none";
    } else {
        // Aucun utilisateur n'est connecté
        document.getElementById("log").style.display = "flex";
    }
});

document.addEventListener('DOMContentLoaded', function () {

    const btnlog = document.getElementById("btnlog");
    const btnsign = document.getElementById("btnsign");
    const connexion = document.getElementById("connexion");
    const inscription = document.getElementById("inscription");
    const logSub = document.getElementById("logSub");
    const signSub = document.getElementById("signSub");
    const login = document.getElementById("login");
    const password = document.getElementById("password");
    const mail = document.getElementById("mail");
    const logPassword = document.getElementById("logPassword");

    btnlog.addEventListener("click", () => {

        btnlog.classList.remove("active");
        btnlog.classList.add("normal");
        btnsign.style.opacity = '0.6';
        btnlog.style.opacity = '1';
        inscription.classList.add("inscription");
        connexion.classList.remove("connexion");
    })

    btnsign.addEventListener("click", () => {
        btnlog.classList.remove("normal");
        btnlog.classList.add("active");
        btnlog.style.opacity = '0.6';
        btnsign.style.opacity = '1';
        inscription.classList.remove("inscription");
        connexion.classList.add("connexion");
    })

    login.addEventListener("input", () => {
        if (login.checkValidity()) {
            login.style.border = "2px solid green";
        }
        else {
            login.style.border = "2px solid red";
        }
    })

    password.addEventListener("input", () => {
        let val2 = password.value;
        if (login.checkValidity()) {
            if (val2.length >= 6) {
                password.style.border = "2px solid green";
                logSub.style.pointerEvents = "all";
                logSub.style.opacity = "1";
            }
            else {
                password.style.border = "2px solid red";
                logSub.style.pointerEvents = "none";
                logSub.style.opacity = "0.6";
            }
        }
    })

    mail.addEventListener("input", () => {
        if (mail.checkValidity()) {
            mail.style.border = "2px solid green";
        }
        else {
            mail.style.border = "2px solid red";
        }
    })

    logPassword.addEventListener("input", () => {
        let val2 = logPassword.value;
        if (mail.checkValidity()) {
            if (val2.length >= 6) {
                logPassword.style.border = "2px solid green";
                signSub.style.pointerEvents = "all";
                signSub.style.opacity = "1";
            }
            else {
                logPassword.style.border = "2px solid red";
                signSub.style.pointerEvents = "none";
                signSub.style.opacity = "0.6";
            }
        }
    })

    document.getElementById("btnLogOut").addEventListener('click', () => {
        document.querySelector("#connexion p").textContent = "";
        login.value = "";
        password.value = "";
        mail.value = "";
        logPassword.value = "";
        firebase.auth().signOut();
    });

    const profile = document.getElementById("profile");

    profile.addEventListener('click', function (event) {
        // Récupérer l'ID de l'utilisateur à partir de l'élément cliqué
        let userId = firebase.auth().currentUser.uid;

        // Rediriger vers la page du profil de l'utilisateur en passant l'ID dans l'URL
        window.location.href = 'profil.html?userId=' + userId;
    });
});