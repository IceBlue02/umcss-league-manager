# UoM Cue Sports Society League Manager
A league management application for the [University of Manchester Cue Sports Club](https://www.sport.manchester.ac.uk/sport-and-activity/sport-a-to-z/cue-sports/), built in TypeScript, using Electron.js and React.

Based on the [original version](https://github.com/IceBlue02/Cue-Sports-League-Manager/), originally written by Ashley Smith and Jonathan Mulvey, and improved by Ewan Massey

**Want to use this?** Even within our club, this software is still considered beta and under active development, and we aren't ready to put out public releases just yet. I'd recommend getting in contact with me ([Email](mailto:ewanmassey1@gmail.com) or [Twitter](https://twitter.com/ewanmassey14)) and I'll help you get set up.

**Want to contribute?** Awesome! See the contributing section below.

Licenced under the GNU General Public License 3.0.

## Features
* Custom Swiss-esque matchmaking algorithm
* Performance weighted scoring system, with CSV scoring export
* Automatic and fair allocation of bye rounds where necessary
* Basic player management 
* Automatic backup

### Matchmaking
Our matchmaking aim is to place players with simular win loss records against each other, on a night by night basis (previous performance does not affect the matchmaking, but does affect scoring- see below). We aim to always avoid players replaying any earlier than necessary, even at the expense of heavily 'unfair' games, but the algorithm can be customised to change when to prefer replaying over differing games. This works well at our league nights, giving a good variety of opponent each week and not penalising 'off weeks' whilst ensuring players are getting competitive games every week.

Technically, a weighting function is applied to each possible matchup based on the difference in record, and whether opponents have played already. A greedy algorithm then selects the best match repeatedly (breaking ties randomly), until the problem has been reduced enough (currently to the last 8 players) for an enumeration algorithm to take over, selecting the best possible set of games. 

Byes are assigned where necessary (odd number of players in the round). The algorithm assigns the bye to the player who has played the most games since taking a bye, breaking a tie randomly.

### Scoring

This scoring system was originally devised by Ashley Smith, and has served us well, with me making small tweaks along the way. This point system persists throughout the league nights every week during the semester and is used to decide the league standings.

* **Per meeting:** 1 point for attending an evening.
* **Per Game:**
    * **Winning against an opponent with less points:** 1 point.
    * **Winning against an opponent with more points:** 1 + (1/5 point difference between opponents) points.
    * **Losing:** No change.
* **For taking a bye:** 1/2 point.

The system aims to promote meeting attendance, but also allow good players who can't attend every week, or start later in the semester, to quickly rise up the league table. The bye point aims to avoid too much disadvantage for being assigned a bye.

## Technologies

The application is based on [Electron](https://www.electronjs.org/). Frontend is handled by [React](https://reactjs.org/), with the (awesome) [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) used in addition.

The source is mainly written in TypeScript.

This was my first time using any of these technologies, so I used this great [starter](https://github.com/yhirose/react-typescript-electron-sample-with-create-react-app-and-electron-builder) by yhirose.

## Running and Building
You'll need [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed.

**Run the application (development only):** `npm run electron:dev`

**Build executables:** `npm run electron:build`

Check out [Electron Builder](https://www.electron.build/) for more details on how to customise the build process.

## Contributing
This application is currently developed pretty much solely by myself to our requirements at UoMCSC. Later down the line, we envisage a more polished, customisable version that can be used by a variety of pool clubs and leagues.

If you'd like to contribute, I'd ask you message me first (to avoid duplication of work etc), or open an issue on the issue tracker. Likewise, if you find bugs or have suggestions, please open an issue.

In terms of features, my next priorities are manually creating/editing/deleting games, as well as general UX polish.
