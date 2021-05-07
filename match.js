const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");
// let matchLink = "https://www.espncricinfo.com/series/ipl-2020-21-1210595/delhi-capitals-vs-mumbai-indians-final-1237181/full-scorecard";


function getMatchDetails(matchLink){
    request(matchLink , function(error , response , data){
        processData(data);
    })
}


function processData(html){
    let myDocument = cheerio.load(html);
    let bothInnings = myDocument(".card.content-block.match-scorecard-table .Collapsible");
    for(let i=0 ; i<bothInnings.length ; i++){
        let oneInning = myDocument(bothInnings[i]);
        // <div class="Collapsible"></div>
        let teamName = oneInning.find("h5").text();
        teamName = teamName.split("INNINGS")[0].trim();
        //console.log(teamName);
        let allTrs = oneInning.find(".table.batsman tbody tr");
        for(let j=0 ; j<allTrs.length-1 ; j++){
            let allTds = myDocument(allTrs[j]).find("td");
            if(allTds.length > 1){
                // batsmanName allTds[0]
                let batsmanName = myDocument(allTds[0]).text().trim();
                // runs allTds[2]
                let runs = parseInt(myDocument(allTds[2]).text().trim());
                // balls
                let balls = parseInt(myDocument(allTds[3]).text().trim());
                //console.log(balls)
                // fours allTds[5]
                let fours = parseInt(myDocument(allTds[5]).text().trim());
                // sixes allTds[6]
                let sixes = parseInt(myDocument(allTds[6]).text().trim());
                // sr allTds[7]
                
                let strikeRate = parseFloat(myDocument(allTds[7]).text().trim());
                // console.log(`Batsman = ${batsmanName} Runs = ${runs} Balls = ${balls} Fours = ${fours} Sixes = ${sixes} StrikeRate = ${strikeRate}`);
               processDetails(teamName , batsmanName , runs , balls , fours , sixes , strikeRate);
               leaderBoardDetails(teamName , batsmanName , runs , balls , fours , sixes , strikeRate)
            }
        }
    }
   
}


function checkIfPlayerExist(batsmanName){

    let leaderBoardPath = './leaderboard.json';
    //console.log(JSON.parse(fs.readFileSync(leaderBoardPath)))
    //let jsonFileArray = (fs.readFileSync(leaderBoardPath))
    let jsonFileArray = JSON.parse(fs.readFileSync(leaderBoardPath));
    
    let name = batsmanName;
    for(let i=0;i<jsonFileArray.length;i++){
        if(jsonFileArray[i].hasOwnProperty(name)){
            return true;
        } 
    }
     return false;
}



function createPlayer(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){
    let leaderBoardPath = "./leaderboard.json";
    //let jsonFileArray = [];
    let jsonFileArray = JSON.parse(fs.readFileSync(leaderBoardPath));
    let File = {
        match : 1,
        team : teamName,
        runs : runs,
        balls: balls,
        fours : fours,
        sixes : sixes,
        strikeRate : strikeRate,
    }
    jsonFileArray.push({[batsmanName] : File})
    fs.writeFileSync( leaderBoardPath , JSON.stringify(jsonFileArray) )
}


function updatePlayer(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){
    let leaderBoardPath = `./leaderboard.json`;
    let jsonFileArray = JSON.parse(fs.readFileSync(leaderBoardPath));

    let index;
    for(let i=0;i<jsonFileArray.length;i++){
        if(jsonFileArray[i].hasOwnProperty(batsmanName)){
            index = i;
        } 
    }
   
    jsonFileArray[index][[batsmanName]]={
        ...jsonFileArray[index][[batsmanName]],
            "match": jsonFileArray[index][[batsmanName]]["match"] +1,
           "runs" : jsonFileArray[index][[batsmanName]]["runs"] + runs,
           "balls" : jsonFileArray[index][[batsmanName]]["balls"] + balls,
           "fours" : jsonFileArray[index][[batsmanName]]["fours"] + fours,
           "sixes" : jsonFileArray[index][[batsmanName]]["sixes"] + sixes,
           "strikeRate" : (jsonFileArray[index][[batsmanName]]["runs"]+runs)/(jsonFileArray[index][[batsmanName]]["balls"]+balls)*100
    } 
    fs.writeFileSync( leaderBoardPath , JSON.stringify(jsonFileArray) )

}

function leaderBoardDetails(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){

    let playerExist = checkIfPlayerExist(batsmanName)
    //console.log(playerExist)
    if(playerExist==false){
        
        createPlayer(teamName , batsmanName , runs , balls , fours , sixes , strikeRate)
    }
    else{
        updatePlayer(teamName , batsmanName , runs , balls , fours , sixes , strikeRate)
    }

}


function checkTeamFolder(teamName){
    // teamFolderPath = "./IPL/Delhi Capitals"
    let teamFolderPath = `./IPL/${teamName}`;
    return fs.existsSync(teamFolderPath);
}
function checkBatsmanFile(teamName , batsmanName){
    // "./IPL/Delhi Capitals/Rishabh pant.json"
    let batsmanFilePath = `./IPL/${teamName}/${batsmanName}.json`;
    return fs.existsSync(batsmanFilePath);
}
function updateBatsmanFile(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){
    let batsmanFilePath = `./IPL/${teamName}/${batsmanName}.json`;
    let batsmanFile = JSON.parse(fs.readFileSync(batsmanFilePath));
    let inning = {
        Runs : runs , 
        Balls : balls , 
        Fours : fours , 
        Sixes : sixes ,
        StrikeRate : strikeRate
    }
    batsmanFile.push(inning);
    fs.writeFileSync( batsmanFilePath , JSON.stringify(batsmanFile) );
}
function createBatsmanFile(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){
    let batsmanFilePath = `./IPL/${teamName}/${batsmanName}.json`;
    let batsmanFile = [];
    let inning = {
        Runs : runs , 
        Balls : balls , 
        Fours : fours , 
        Sixes : sixes ,
        StrikeRate : strikeRate
    }
    batsmanFile.push(inning);
    fs.writeFileSync( batsmanFilePath , JSON.stringify(batsmanFile) );
}
function createTeamFolder(teamName){
    let teamFolderPath = `./IPL/${teamName}`;
    fs.mkdirSync(teamFolderPath);
}

function processDetails(teamName , batsmanName , runs , balls , fours , sixes , strikeRate){
    let isTeamFolder = checkTeamFolder(teamName);
    if(isTeamFolder){
        let isBatsmanPresent = checkBatsmanFile(teamName , batsmanName);
        if(isBatsmanPresent){
            updateBatsmanFile(teamName , batsmanName , runs , balls , fours , sixes , strikeRate);
        }
        else{
            createBatsmanFile(teamName , batsmanName , runs , balls , fours , sixes , strikeRate);
        }
    }
    else{
        createTeamFolder(teamName);
        createBatsmanFile(teamName , batsmanName , runs , balls , fours , sixes , strikeRate);
    }
}



module.exports = getMatchDetails;