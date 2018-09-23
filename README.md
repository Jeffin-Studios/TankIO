Hosted On Heroku: https://phasertanksio.herokuapp.com/



Ignore the text below, those are development notes.

Make rock obstacles, where hitbox is entire thing, unlike trees
Make grassy patch. Tanks get stealth. Following enemies stop following, but if enemy tank wanders in and bumps into you, bad news
Make slimy path. Slows down tank

Make powerups (used by spacebar)
1. stealth
2. ghost (pass through obstacles, tanks)
3. summon (summon a wall)
4. stun (shoots slow moving stun projectile)
5. bombard (explosive attack, heavy damage to multiple targets)
6. Shield (deflects attack)
7. multi-directinal (shoots in multiple directions simultaneously)




Architecture
===========
Game instance has a gamemap (players list, enemies list, bullets list) that stores object data for each player and enemyBullets

Players bullets is in object. To see if player hits any enemy players, iterate through players list and uses phaser detector to see if there is a collision. Send event to server, took damage. If damage is enough, send death event.

Enemies bullets is external. If any hits the player, send event to server, took damage. If damage is enough, send death event.

In bullets list keep track of where each bullet came from by having source id field in bullets object

Server has a list of players and enemy objects (basic constructor info)
When user connects, a new player is created on the Server
Server sends players list to newly connected client
Client iterates through list and for each player, creates a player object and adds to gamemap

Server then broadcasts the new player object to all the other Clients, which create corresponding player objects to add to their game maps

Updating
========
Action listeners to update position of the Client
If there is a change in position, emit to Server
Server handles by updating the server playerlist. It finds the specific player at index socket.id (the socket that sent it)
Server then broadcasts player moved event along with the updated player object at index socket.id to all the other clients
Client takes this player object, finds the local player object in its gamemap with the same player id, and updates it accordingly



On server, for each enemy iterate through to find closest player, and set that as its target


Make a new projectile that can only be fired one at a time (new group with only one sprite)
When it hits an enemy, prevents them from firing for a certain time (set interval)

Basic template:

Expanding bitmap, birds eye view perspective.
Player shoots bullets
Enemies also shoot bullets

Long range and short range classes
Implement special abilities

Enemies (mobs) either chase you or run away from you and snipe

Some obstacles (trees, rocks, bushes) can be destroyed by bullets




Fixes
=====
Make viewscreen size scaled to window size
Make realtime chat to the right
Make enemies server shared
Keep track of bullets Bullets
Figure out mechanism to kill players
