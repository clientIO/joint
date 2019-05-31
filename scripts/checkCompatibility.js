(function() {
    var fs = (document.location.protocol === 'file:');
    var ff = (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
    if (fs && !ff) {
        document.getElementsByTagName('body')[0].innerHTML = '';
        document.write('<h2>This is ES6 demo. It requires ES6 complaint browser and access through the Web Server</h2>');


        document.write('<b>go to the jointJS ROOT folder, install and run the server:</b><br/>');
        document.write('<code>npm install http-server -g</code></br>');
        document.write('<code>http-server -p 8081</code><br/><br/>');

        document.write('<b>The demo should be on this location:</b><br/>');
        let link = 'http://localhost:8081' + window.location.href.substr(window.location.href.indexOf('/demo'));
        document.write('<a href="' + link + '">' + link + '</a><br/>');
    }
})();
