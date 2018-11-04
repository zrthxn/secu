const express = require('express');
const fs = require('fs');
const path = require('path');
const AdminConfig = require('./config.json');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, ()=>{
    console.log('\n\tServer listening on PORT :: ' + PORT + '\n');
});

// LOGIN PAGE HERE
app.get('/', (req,res)=>{ res.sendFile(path.resolve(__dirname, 'public', 'login.html')) });

app.get('/u/keygen', (req,res)=>{
    let params = getParameters(req);
    let pubkey = generateKey(params.mac);
    res.status(200).json({'pubkey' : pubkey, });
});

app.post('/u/login', (req,res)=>{
    let params = {
        password : Buffer.from( ((req.url.split('?')[1]).split('&')[0]).split('=')[1] , 'base64').toString('ascii'),
        pubkey : ((req.url.split('?')[1]).split('&')[1]).split('=')[1],
        mac : ((req.url.split('?')[1]).split('&')[2]).split('=')[1]
    }
    fs.readFile('admin-access-keys/key-'+ params.mac +'.json', (err,content)=>{
        if(err) return console.log("error");
        if(params.password===AdminConfig.password && params.pubkey=== JSON.parse(content).key.pubkey) {
            res.status(200).json({'pid' : JSON.parse(content).key.pvtkey});
        }
    });
});

app.get('/u/login/p', (req,res)=>{
    let params = getParameters(req);
    fs.readFile('admin-access-keys/key-'+ params.mac +'.json', (err,content)=>{
        if(err) return console.log("error");
        if(Buffer.from(params.id, 'base64').toString('ascii') === JSON.parse(content).key.pvtkey) {
            // ACCOUNT/PRIVATE PAGE HERE
            res.sendFile(path.resolve(__dirname, 'public', 'area.html'));
        }
    });
});

app.post('/u/login/p', (req,res)=>{
    let params = getParameters(req);
    fs.readFile('admin-access-keys/key-'+ params.mac +'.json', (err,content)=>{
        if(err) return console.log("error");
        if(Buffer.from(params.pvt, 'base64').toString('ascii') === JSON.parse(content).key.pvtkey) {
            res.status(200).json({'verify' : true});
        } else {
            res.status(200).json({'verify' : false});
        }
    });
});

app.post('/u/logout', (req,res)=>{
    let params = getParameters(req);
    fs.writeFile('admin-access-keys/key-'+ params.mac +'.json', JSON.stringify({
        'key' : {
            'pubkey' : '',
            'pvtkey' : ''
        },
        'mac' : ''
    }), (e) => {
        if (e) return console.error(e);
    });
    res.sendStatus(200);
});

//------------------------------------------------------------------------------------------------------//
// DIRECT UTILITY FUNCTIONS =================================================== DIRECT UTILITY FUNCTIONS//
//------------------------------------------------------------------------------------------------------//

function generateKey(mac) {
    let pubkey = '', pvtkey = '';
    for(var i=0 ; i<12 ; i++)
        pubkey = pubkey + Math.floor(Math.random()*16).toString(16);
    
    for(var i=0 ; i<24 ; i++)
        pvtkey = pvtkey + Math.floor(Math.random()*16).toString(16);
    
    fs.readFile('admin-access-keys/key-'+ mac +'.json', (err,content)=>{
        if(err) {

        } else {
            // EMAIL to admin => 'Access from new machine';
        }
        fs.writeFile('admin-access-keys/key-'+ mac +'.json', JSON.stringify({
            'key' : {
                'pubkey' : pubkey,
                'pvtkey' : pvtkey
            },
            'mac' : mac
        }), (e) => {
            if (e) return console.error(e);
        });
    });    
    return pubkey;
}

function getParameters(request){
    url = request.url.split('?');
    var query = {
        "action" : url[0]
    };
    if(url.length>=2){
        url[1].split('&').forEach((q)=>{
            try{
                query[q.split('=')[0]] = q.split('=')[1];
            } catch(e) {
                query[q.split('=')[0]] = '';
            }
        })
    }
    return query;
}