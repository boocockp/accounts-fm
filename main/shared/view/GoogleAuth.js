'use strict';

var CLIENT_ID = '867433409387-eark41u00nigpo124h0n9563c92th8eo.apps.googleusercontent.com';

var SCOPES = ['https://www.googleapis.com/auth/drive'];


var GoogleAuthProto = Object.create(HTMLElement.prototype, {
    authorized: {
        get: function () {
            return this._authorized || (this._authorized = new DataSequence());
        },
        enumerable: true
    }
});

GoogleAuthProto.authorize = function () {
    return this._authorize();
};

GoogleAuthProto.attachedCallback = function () {
    console.log(this.tagName, 'attachedCallback');
    this.innerHTML = this.html();

    this.querySelector('button').addEventListener('click', this._authorize.bind(this));
};

GoogleAuthProto.html = function () {
    return `<button>Sign in</button> <span class="login-state">Signed out</span>
        `;
};


GoogleAuthProto._authorize = function () {
    let loginState = this.querySelector('.login-state');

    function handleAuthResult(authResult) {
        if (authResult && !authResult.error) {
            loginState.innerHTML = 'Signed in';
            gapi.client.load('drive', 'v3');
            this.authorized.add("AUTHORIZED");
            let event = jQuery.Event( "googleAuth" );
            event.value = "AUTHORIZED";
            $(document).trigger( event );
        } else {
            loginState.innerHTML = 'Signed out';
            this.authorized.add("SIGNED_OUT");
            let event = jQuery.Event( "googleAuth" );
            event.value = "SIGNED_OUT";
            $(document).trigger( event );
        }
    }

    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult.bind(this));
};

var GoogleAuth = document.registerElement('google-auth', {prototype: GoogleAuthProto});

