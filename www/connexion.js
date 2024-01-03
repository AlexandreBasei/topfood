const npxPlugins = Plugins.Capacitor();

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

const registerNotifications = async () => {
    let permStatus = await npxPlugins.PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
        permStatus = await npxPlugins.PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
    }

    await npxPlugins.PushNotifications.register();
}

registerNotifications();

const getToken = async () => {
    return new Promise(async (resolve, reject) => {
        await npxPlugins.PushNotifications.addListener('registration', token => {
          resolve(token.value);
        });
    })
}

firebase.initializeApp(config);
// const messaging = firebase.messaging();

const database = firebase.database();

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // L'utilisateur est connecté
        let userId = user.uid;
        let ref = firebase.database().ref("users/" + userId);

        ref.once('value', async (snapshot) => {

            if (snapshot.exists() == false) {
                ref.set({
                    name: 'Utilisateur',
                    desc: 'Bienvenue sur mon profil !',
                    defaultpp: 1,
                    nbPosts: 0,
                    followers: "",
                    nbFollowers: 0,
                    followed: "",
                    nbFollowed: 0,
                    liked:"",
                    token: await getToken(),
                })
            }
            ref.update({
                token: await getToken()
            })
        })

        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + userId + '/' + userId);
        let defaultImgRef = storageRef.child('defaultpp.svg');

        ref.on('value', (snapshot) => {
            let data = snapshot.val();

            if (data.defaultpp == 1) {
                defaultImgRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    let profile = document.getElementById('profile');
                    profile.style.backgroundImage = "url(" + url + ")";
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }
            else {
                imageRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    let profile = document.getElementById('profile');
                    profile.style.backgroundImage = "url(" + url + ")";
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }
        })
        // token = requestPermission();
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

    const profile = document.getElementById("profile");

    profile.addEventListener('click', function (event) {
        // Récupérer l'ID de l'utilisateur à partir de l'élément cliqué
        let userId = firebase.auth().currentUser.uid;

        // Rediriger vers la page du profil de l'utilisateur en passant l'ID dans l'URL
        window.location.href = './profil.html?userId=' + userId;
    });
});