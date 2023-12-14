const getImg = async (id) => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child(`users/${id}/${id}`);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

const getDefaultImg = async () => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child(`defaultpp.svg`);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

const handleSearch = () => {
    return new Promise(async (resolve, reject) => {
        const searchTerm = searchInput.value;
        const searchResults = document.getElementById('searchResults');

        const nameRef = firebase.database().ref('users/');
        const userRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`)

        // Efface les résultats précédents
        searchResults.innerHTML = '';

        if (searchTerm == '') {
            searchResults.innerHTML = '';
        }

        else {
            try {
                const snapshot = await nameRef.orderByChild('name').startAt(searchTerm).endAt(searchTerm + '\uf8ff').once('value');
                snapshot.forEach(userSnapshot => {
                    const userData = userSnapshot.val();
                    const userId = userSnapshot.key;

                    const listItem = document.createElement('li');

                    const currentRef = firebase.database().ref(`users/${userId}`);

                    userRef.once('value', async (snapshot) => {

                        let data = snapshot.val();
                        let followed = data.followed.split(',');

                        currentRef.once("value", async (snapshot2) => {
                            let currentData = snapshot2.val();

                            if(followed.includes(userId) == false && currentData.defaultpp == 1 && firebase.auth().currentUser.uid != userId) {
                                listItem.innerHTML = `
                                <a href='./profil.html?userId=${userId}'><img src="${await getDefaultImg()}"></a>
                                <a href='./profil.html?userId=${userId}'>${userData.name}</a>
                                <button id="${userId}" onclick="follow(${userId})">Suivre</button>
                              `;
                              searchResults.appendChild(listItem);
                            }
                            else if (followed.includes(userId) && currentData.defaultpp == 1 && firebase.auth().currentUser.uid != userId) {
                                listItem.innerHTML = `
                                <a href='./profil.html?userId=${userId}'><img src="${await getDefaultImg()}"></a>
                                <a href='./profil.html?userId=${userId}'>${userData.name}</a>
                                <button id="${userId}" class='followed' onclick="follow(${userId})">Suivi(e)</button>
                              `;
                              searchResults.appendChild(listItem);                            }
                            else if (followed.includes(userId) && currentData.defaultpp == 0 && firebase.auth().currentUser.uid != userId) {
                                listItem.innerHTML = `
                                <a href='./profil.html?userId=${userId}'><img src="${await getImg(userId)}"></a>
                                <a href='./profil.html?userId=${userId}'>${userData.name}</a>
                                <button id="${userId}" class='followed' onclick="follow(${userId})">Suivi(e)</button>
                              `;
                              searchResults.appendChild(listItem);
                            }
                            else if (followed.includes(userId) == false && currentData.defaultpp == 0 && firebase.auth().currentUser.uid != userId) {
                                listItem.innerHTML = `
                                <a href='./profil.html?userId=${userId}'><img src="${await getImg(userId)}"></a>
                                <a href='./profil.html?userId=${userId}'>${userData.name}</a>
                                <button id="${userId}" onclick="follow(${userId})">Suivre</button>
                              `;
                              searchResults.appendChild(listItem);
                            }
                        })
                    })
                });
                resolve();
            } catch (error) {
                console.error('Erreur de recherche :', error);
            }
        }

        // Effectue une requête vers Firebase pour les utilisateurs correspondants au nom recherché
    })
}

const follow = (uid) => {
    const id = uid.id;
    const usersRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`);

    const ref2 = firebase.database().ref("users/" + id + '/followers');

    usersRef.once('value', (snapshot) => {
        let currentFollows = snapshot.val().followed || ""; // Assurez-vous d'avoir une chaîne vide si la valeur est null

        // Si l'élément a déjà la classe 'followed', cela signifie que l'utilisateur veut arrêter de suivre
        if (document.getElementById(id).classList.contains("followed")) {
            // Retirez l'ID de la liste
            currentFollows = currentFollows.split(',').filter(item => item !== id).join(',');

            usersRef.update({ followed: currentFollows });

            ref2.transaction((val) => {
                return Math.max(val - 1, 0);
            })

            document.getElementById(id).classList.remove("followed");
            document.getElementById(id).innerText = "Suivre";
        } else {
            // Vérifiez si la valeur est déjà présente avant de l'ajouter
            if (!currentFollows.includes(id)) {
                if (currentFollows !== "") {
                    currentFollows += ",";
                }
                currentFollows += id;

                ref2.transaction((val) => {
                    return val + 1;
                })

                usersRef.update({ followed: currentFollows });

                sendNotification(token);

                document.getElementById(id).classList.add("followed");
                document.getElementById(id).innerText = "Suivi(e)";
            }
        }
    });
}

const sendNotification = async (token) => {
    try {
        const user = firebase.auth().currentUser;
        const userName = user ? user.displayName : 'Utilisateur inconnu';

        // Envoyer une notification avec Capacitor

        await npxPlugins.PushNotifications.register();
        await npxPlugins.PushNotifications.createChannel({
            description: 'Notification Channel',
            id: 'channel1',
            importance: 5,
            name: 'Channel 1',
            sound: 'notification.mp3',
            visibility: 1,
        });

        await npxPlugins.PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token:', token.value);
        });

        await npxPlugins.PushNotifications.addListener('registrationError', (error) => {
            console.error('Error during push registration:', error);
        });

        await npxPlugins.PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received:', notification);
        });

        await npxPlugins.PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed:', notification);
        });

        await npxPlugins.PushNotifications.subscribe({ topic: 'channel1' });

        await npxPlugins.PushNotifications.sendNotification({
            title: 'TopFood',
            body: `${userName} vous a suivi`,
            channelId: 'channel1',
        });

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification :', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', handleSearch);

    const btnsFollow = document.querySelectorAll('li button');
})