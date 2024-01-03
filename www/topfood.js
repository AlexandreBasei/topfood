const getFollowed = async () => {
    let ref = firebase.database().ref("users/" + userId + '/followed');

    ref.once("value", () => {
        let followed = snapshot.val().followed || "";
        console.log(followed);
    })
}

const getPosts = async () => {
    return new Promise(async (resolve, reject) => {
        await firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const container = document.getElementById("postsContainer");

                const currentUid = user.uid;

                let ref = firebase.database().ref(`users/${currentUid}/followed`);
                let nofollow;

                try {
                    const snapshot = await ref.once('value');
                    const data = snapshot.val();

                    if (data === "") {
                        let elements = document.getElementsByClassName("skPost");

                        for (var i = 0; i < elements.length; i++) {
                            elements[i].style.display = 'none';
                        }
                        let noPost = document.createElement('p');
                        noPost.classList.add('noPost');
                        noPost.textContent = "Suivez des personnes pour voir leurs posts !";
                        container.appendChild(noPost);
                        nofollow = 1;
                    }

                    else {

                        const currentTime = moment();
                        const cutoffTime = moment().subtract(48, 'hours');

                        const followed = data.split(",");

                        followed.forEach(async followUid => {
                            let ref2 = firebase.database().ref(`users/${followUid}/posts`);

                            const snapshot2 = await ref2.once('value');
                            const data2 = snapshot2.val();

                            if (data2 !== null) {

                                Object.keys(data2).forEach(async postKey => {
                                    const post = data2[postKey];

                                    let postContainer = document.createElement('div');
                                    let postContent;

                                    const postDate = moment(post.date, 'DD-MM-YYYY');

                                    if (postDate.isBetween(cutoffTime, currentTime)) {
                                        if (post.photo == 1) {
                                            try {
                                                const imgPost = await getImg(followUid, postKey);
                                                postContainer.classList.add('post');
                                                container.appendChild(postContainer);

                                                let userPPName = await getUserPost(postKey);

                                                let like = await getLike(postKey);

                                                postContent = `
                                                <div class='ppName'>
                                                    ${userPPName}
                                                </div>
                                                <img src='${imgPost}'>
                                                <div class='postTxt'>
                                                    <h3>${post.restaurant}</h3>
                                                    <div class="noteContainer">
                                                    <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                                    </h4>
                                                    </div>
                                                    <p>${post.avis}<p>
                                                    <p class='date'>Posté le ${post.date}</p>
                                                    ${like}
                                                </div>
                                            `;
                                            } catch (error) {
                                                console.error('Erreur lors de la récupération de l\'image :', error);
                                            }
                                        } else {
                                            postContainer.classList.add('post', 'noImgPost');
                                            container.appendChild(postContainer);

                                            let userPPName = await getUserPost(postKey);

                                            let like = await getLike(postKey);

                                            postContent = `
                                            <div class='ppName'>
                                                ${userPPName}
                                            </div>
                                            <div class='postTxt zeroImg'>
                                                <h3>${post.restaurant}</h3>
                                                <div class="noteContainer">
                                                <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                                </h4>
                                                </div>
                                                <p>${post.avis}<p>
                                                <p class='date'>Posté le ${post.date}</p>
                                                ${like}
                                            </div>
                                        `;
                                        }
                                        let elements = document.getElementsByClassName("skPost");

                                        for (var i = 0; i < elements.length; i++) {
                                            elements[i].style.display = 'none';
                                        }
                                        postContainer.innerHTML = postContent;
                                    }
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération des données :", error);
                }
                resolve(nofollow);
            }
        });
    })
};

const getPopularPosts = async () => {
    return new Promise(async (resolve, reject) => {
        await firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const container = document.getElementById("postsContainer2");

                const currentUid = user.uid;

                const ref = firebase.database().ref(`postsLikes`);

                try {
                    const snapshot = await ref.orderByChild('likes').once('value');

                    const data = snapshot.val();

                    if (data !== "") {

                        const dataArray0 = Object.entries(data).map(([key, value]) => ({ key, ...value }));

                        const dataArray = dataArray0.filter(item => item.likes !== 0);

                        dataArray.sort((a, b) => b.likes - a.likes);

                        const currentTime = moment();
                        const cutoffTime = moment().subtract(48, 'hours');

                        // Utilisez une boucle for...of pour garantir l'ordre d'exécution
                        for (const el of dataArray) {
                            const postKey = el.key;

                            const idUserPost = postKey.slice(0, 28);

                            const ref2 = firebase.database().ref(`users/${idUserPost}/posts/${postKey}`);

                            const snapshot2 = await ref2.once('value');

                            const post = snapshot2.val();

                            let postContainer = document.createElement('div');
                            let postContent;

                            const postDate = moment(post.date, 'DD-MM-YYYY');

                            if (postDate.isBetween(cutoffTime, currentTime)) {
                                if (post.photo == 1) {
                                    try {
                                        const imgPost = await getImg(idUserPost, postKey);
                                        postContainer.classList.add('post');
                                        container.appendChild(postContainer);

                                        let userPPName = await getUserPost(postKey);

                                        let like = await getLike(postKey);

                                        postContent = `
                                                <div class='ppName'>
                                                    ${userPPName}
                                                </div>
                                                <img src='${imgPost}'>
                                                <div class='postTxt'>
                                                    <h3>${post.restaurant}</h3>
                                                    <div class="noteContainer">
                                                    <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                                    </h4>
                                                    </div>
                                                    <p>${post.avis}<p>
                                                    <p class='date'>Posté le ${post.date}</p>
                                                    ${like}
                                                </div>
                                            `;
                                    } catch (error) {
                                        console.error('Erreur lors de la récupération de l\'image :', error);
                                    }
                                } else {
                                    postContainer.classList.add('post', 'noImgPost');
                                    container.appendChild(postContainer);

                                    let userPPName = await getUserPost(postKey);

                                    let like = await getLike(postKey);

                                    postContent = `
                                            <div class='ppName'>
                                                ${userPPName}
                                            </div>
                                            <div class='postTxt zeroImg'>
                                                <h3>${post.restaurant}</h3>
                                                <div class="noteContainer">
                                                <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                                </h4>
                                                </div>
                                                <p>${post.avis}<p>
                                                <p class='date'>Posté le ${post.date}</p>
                                                ${like}
                                            </div>
                                        `;
                                }
                                let elements = document.getElementsByClassName("skPost");

                                for (var i = 0; i < elements.length; i++) {
                                    elements[i].style.display = 'none';
                                }
                                postContainer.innerHTML = postContent;
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération des données :", error);
                }
                resolve();
            }
        });
    });
};


const getUserPost = async (postKey) => {
    return new Promise((resolve, reject) => {
        let idUserPost = postKey.slice(0, 28);

        let ref = firebase.database().ref("users/" + idUserPost);

        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + idUserPost + '/' + idUserPost);
        let defaultImgRef = storageRef.child('defaultpp.svg');

        ref.once("value").then((snapshot) => {
            const data = snapshot.val();
            let res;

            if (data.defaultpp == 1) {
                defaultImgRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    res = `
                    <a href='./profil.html?userId=${idUserPost}'><img src='${url}'></a>
                    <a href='./profil.html?userId=${idUserPost}'>${data.name}</a>
                    `;
                    resolve(res);
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }
            else {
                imageRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    res = `
                    <a href='./profil.html?userId=${idUserPost}'><img src='${url}'></a>
                    <a href='./profil.html?userId=${idUserPost}'>${data.name}</a>
                    `;
                    resolve(res);
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }

        })
    })
}

const getImg = async (uid, id) => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + uid + '/posts/' + id);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

const getLike = async (postKey) => {
    let idUserPost = postKey.slice(0, 28);

    const snapshot = await firebase.database().ref(`users/${firebase.auth().currentUser.uid}`).once("value");

    let data = snapshot.val();
    let liked = data.liked;

    if (typeof liked === 'string') {
        liked = liked.split(',');
    } else {
        liked = [];
    }

    const snapshot2 = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

    let data2 = snapshot2.val();

    let nbLikes;

    try {
        nbLikes = data2.likes;
    } catch (error) {
        nbLikes = 0;
    }


    if (!liked.includes(postKey)) {
        return `<button id="${postKey}" class="like" onclick="like('${postKey}')"><svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur-svg</title><style>.s1 { fill: #cacaca } </style><g id="_01_align_center"><path id="Layer" class="s1" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6zm-5.5 19.9c-3.3-2.4-10-8.4-10-12.8q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9h2q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9c0 4.4-6.7 10.4-10 12.8z"/></g></svg>${nbLikes}</button>`;
    }
    else {
        return `<button id="${postKey}" class="like liked" onclick="like('${postKey}')"><svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur (1)-svg</title><style>.s2 { fill: #f91880 } </style><g id="Layer 1"><path id="Layer" class="s2" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6z"/></g></svg>${nbLikes}</button>`
    }
}

const like = async (postKey) => {
    let idUserPost = postKey.slice(0, 28);

    const likerId = firebase.auth().currentUser.uid;

    const ref = firebase.database().ref(`users/${likerId}`);

    const ref2 = firebase.database().ref(`postsLikes/${postKey}/likes`);

    const snapshot = await firebase.database().ref(`users/${idUserPost}/posts/${postKey}`).once("value");

    let data = snapshot.val();

    const btn = document.getElementById(postKey);

    const snapshot2 = await firebase.database().ref(`users/${likerId}`).once("value");

    let liked = snapshot2.val().liked || "";

    if (document.getElementById(postKey).classList.contains("liked")) {

        liked = liked.split(',').filter(item => item !== postKey).join(',');

        ref.update({ liked: liked });

        const transac = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

        let transacData = transac.val();

        let nbLikes = transacData.likes;
        nbLikes = Math.max(transacData.likes - 1, 0);

        firebase.database().ref(`postsLikes/${postKey}`).update({ likes: nbLikes });

        btn.classList.remove("liked");
        btn.classList.add("anim");
        setTimeout(() => {
            btn.classList.remove("anim");
        }, 300);
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur-svg</title><style>.s1 { fill: #cacaca } </style><g id="_01_align_center"><path id="Layer" class="s1" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6zm-5.5 19.9c-3.3-2.4-10-8.4-10-12.8q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9h2q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9c0 4.4-6.7 10.4-10 12.8z"/></g></svg>${nbLikes}`;
    }
    else {

        if (liked !== "") {
            liked += ",";
        }

        liked += postKey;

        ref.update({ liked: liked });

        const transac = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

        let transacData = transac.val();

        let nbLikes;

        try {
            nbLikes = transacData.likes;
            nbLikes = transacData.likes + 1;
        } catch (error) {
            nbLikes = 1;
        }

        firebase.database().ref(`postsLikes/${postKey}`).update({ likes: nbLikes });

        btn.classList.add("liked");
        btn.classList.add("anim");
        setTimeout(() => {
            btn.classList.remove("anim");
        }, 300);
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur (1)-svg</title><style>.s2 { fill: #f91880 } </style><g id="Layer 1"><path id="Layer" class="s2" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6z"/></g></svg>${nbLikes}`;
    }

}

document.addEventListener('DOMContentLoaded', async () => {

    const postsContainer = document.getElementById("postsContainer");
    const main = document.querySelector("main");
    let posts = await getPosts();

    try {
        if (postsContainer.childElementCount <= 2 && posts) {

            postsContainer.style.display = "none"
            let noPost = document.createElement('p');
            noPost.classList.add('noPost');
            noPost.textContent = "Personne n'a posté récemment ou vous ne suivez personne";
            noPost.id = "noPost";
            main.appendChild(noPost);
        }
    } catch (error) {
        
    }

    const abonnements = document.getElementById('abonnements');
    const populaire = document.getElementById('populaire');
    const postsContainer2 = document.getElementById("postsContainer2");

    populaire.addEventListener('click', () => {
        postsContainer2.innerHTML = "";
        postsContainer.innerHTML = `
        <div class="skPost">
        <div id="skPPContainer">
            <div id="skPP" class="skeleton"></div>
            <p class="skeleton skeleton-text"></p>
        </div>
        <div class="skeleton" id="skImg"></div>
        <p id="skResto" class="skeleton skeleton-text"></p>
        <p id="skNote" class="skeleton skeleton-text"></p>
        <p class="skDesc skeleton skeleton-text"></p>
        <p id="skDesc" class="skeleton skeleton-text"></p>
    </div>
        `;
        abonnements.classList.remove("selected");
        populaire.classList.add("selected");

        if (document.getElementById("noPost")) {
            document.getElementById("noPost").style.display="none";
        }

        postsContainer.classList.remove("containerSelected");
        postsContainer.classList.add("gauche");
        postsContainer2.classList.add("containerSelected");
        postsContainer2.classList.remove("droite");

        getPopularPosts();
    });

    abonnements.addEventListener('click', async () => {
        postsContainer.innerHTML = `
        <div class="skPost">
        <div id="skPPContainer">
            <div id="skPP" class="skeleton"></div>
            <p class="skeleton skeleton-text"></p>
        </div>
        <div class="skeleton" id="skImg"></div>
        <p id="skResto" class="skeleton skeleton-text"></p>
        <p id="skNote" class="skeleton skeleton-text"></p>
        <p class="skDesc skeleton skeleton-text"></p>
        <p id="skDesc" class="skeleton skeleton-text"></p>
    </div>
        `;
        postsContainer2.innerHTML="";

        populaire.classList.remove("selected");
        abonnements.classList.add("selected");

        postsContainer.classList.add("containerSelected");
        postsContainer.classList.remove("gauche");
        postsContainer2.classList.remove("containerSelected");
        postsContainer2.classList.add("droite");

        
        posts = await getPosts();

        try {

            if (postsContainer.childElementCount <= 1 && posts) {

                postsContainer.style.display = "none"
                let noPost = document.createElement('p');
                noPost.classList.add('noPost');
                noPost.textContent = "Personne n'a posté récemment ou vous ne suivez personne";
                noPost.id = "noPost";
                main.appendChild(noPost);
            }
        } catch (error) {
            
        }
    });

});