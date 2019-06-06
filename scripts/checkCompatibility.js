(function() {
    var fs = (document.location.protocol === 'file:');
    var ff = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
    if (fs && !ff) {

        var br = document.createElement('br');
        var body = document.body;
        body.innerHTML = '';

        var header1 = document.createElement('h2');
        header1.innerText = 'This is ES6 demo. It requires ES6 complaint browser and access through the Web Server';
        body.appendChild(header1);

        var b1 = document.createElement('b');
        b1.innerText = 'go to the JointJS ROOT folder, install and run the server:';
        body.appendChild(b1);
        body.appendChild(br.cloneNode());

        var code1 = document.createElement('code');
        code1.innerText = 'npm install http-server -g';
        body.appendChild(code1);
        body.appendChild(br.cloneNode());

        var code2 = document.createElement('code');
        code2.innerText = 'http-server -p 8081';
        body.appendChild(code2);
        body.appendChild(br.cloneNode());

        var b2 = document.createElement('b');
        b2.innerText = 'The demo should be on this location:';
        body.appendChild(b2);
        body.appendChild(br.cloneNode());

        var a = document.createElement('a');
        var link = 'http://localhost:8081' + window.location.href.substr(window.location.href.indexOf('/demo'));
        a.href = link;
        a.innerText = link;
        body.appendChild(a);
    }
})();
