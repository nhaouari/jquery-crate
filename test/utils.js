import {session} from "../src/index";

export class simulation {
    constructor() {

    }

    async init(options, startSessionId = 0) {
        this.setSimulationOptions(options)
        // create all sessions 


        this._sessions = []
        for (let i = 0; i < this._nbSessions; i++) {
            this._sessions.push(this.startSession)
        }
        const LoadSessions = await Promise.all[this._sessions].catch((error) => {
            console.log(`ERROR ${error}`)
        });


    }

    async startSession() {
        const s = new session(this._crateOptions)
        const session = await new Promise((resolve, reject) => {

                const promiseResolved = false;

                s.on("new_document", () => {
                    resolve(s)
                    promiseResolved = true
                })

                setTimeout(() => {
                    if (promiseResolved === false)
                        throw 'ERROR could not creat a new document'
                }, 10000)


            })
            .catch((e) => {
                resolve(null)
                console.log(e);
            })

        return session
    }

    setSimulationOptions(options) {
        this._options = Object.assign(this.constructor.defaultOptions, options);
        this._nbSessions = this._options.nbSessions;
        this._maxRandomTime = this._options.maxRandomTime;
        this._nbRounds = this._options.nbRounds;
        this._URL = this._options.URL;
        this._preSimulationTime = this._options.preSimulationTime;
        this._seed = this._options.seed;
        this._useSignalingServer = this._options.useSignalingServer;
        this._crateOptions = options.crateOptions;
    }


    getRandomTime() {
        return this.random() * this._maxRandomTime;
    }


    foglet(i) {
        return this._sessions[i]._foglet;
    }
    spray(i) {
        return this.foglet(i).overlay().network.rps;
    }
    exchange(i) {
        this.spray(i)._exchange();
    }

    getAllNeighbors() {
        /*let allNeighbors = this._sessions.reduce((acc,curr)=>{
          acc.push(this.getNeighborsOf(curr))
        })*/
        let allNeighbors = [];
        this._sessions.forEach(session => {
            const neighbors = this.getNeighborsOf(session);
            allNeighbors.push(neighbors);
        });
        return allNeighbors;
    }

    getNeighborsOf(session) {
        let Neighbors = session._foglet.getNeighbours().map(uglyID => {
            return this.unuglifyID(uglyID);
        });

        console.log("CRATE " + session.id + " : " + Neighbors.length, Neighbors);
        return Neighbors;
    }

    getText(i) {
        console.log("CRATE " + i);
        let text = this._sessions[
            i
        ]._documents[0]._view._editor.viewEditor.getText();
        console.log(text);
        return text;
    }

    getSequence(i) {
        let children = this._sessions[i]._documents[0].sequence.root.children;
        return children;
    }

    peekRandomChar() {
        let possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let char = possible.charAt(Math.floor(this.random() * possible.length));
        return char;
    }

    pickRandomNodeID() {
        const chosenNode = Math.floor(this.random() * this._nbSessions);
        console.log(`Node ${chosenNode} is chosen`);
        return chosenNode;
    }
    random() {
        if (this._seed == -1) {
            return Math.random();
        } else {
            var x = Math.sin(this._seed++) * 10000;
            return x - Math.floor(x);
        }
    }


}