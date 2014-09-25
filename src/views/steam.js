'use strict';
function steam(settings) {
	return Promise.all([
			asyncGet(settings.api_url + "ISteamUser/GetPlayerSummaries/v0002/?format=json&key=" + settings.api_key + "&steamids=" + settings.user_id),
			asyncGet(settings.api_url + "ISteamUser/GetFriendList/v0001/?format=json&key=" + settings.api_key + "&steamid=" + settings.user_id),
			asyncGet(settings.api_url + "IPlayerService/GetOwnedGames/v0001/?format=json&key=" + settings.api_key + "&steamid=" + settings.user_id),
			asyncGet(settings.api_url + "IPlayerService/GetRecentlyPlayedGames/v0001/?format=json&key=" + settings.api_key + "&steamid=" + settings.user_id)
	]);
}
// http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=440&key=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&steamid=76561197972495328


	/*
	var context = {};
	asyncGet('http://steamcommunity.com/id/' + settings.username + '/games?tab=all&xml=1').then(function(res) {
		console.log(res);
});
}
/*
	username_r.open('GET', 'http://steamcommunity.com/id/' + settings.username + '/games?tab=all&xml=1', false);
	username_r.onload = function() {
		if(this.status != 200) return;
		settings.steamid  = this.response.getElementsByTagName('steamID64')[0].firstChild.textContent;
		settings.totalgames = this.response.getElementsByTagName('game').length;
		settings.recents_games_nodelist = this.response.getElementsByTagName('hoursLast2Weeks');
	};
	username_r.send();

    	var payload = {'key': settings.api_url, 'steamids': settings.steamid},
	players = [], friendscount;

	user_r.open('GET', settings.api_url + '/GetPlayerSummaries/v0002/', false);
	user_r.onload = function() {
		if ( this.status != 200) return;
	        players = JSON.parse(this.responseText)['response']['players'];
		context.user = players[0];
	};

	friends_r.open('GET', settings.api_url + '/GetFriendList/v0001/?key=' +
			settings.api_key + '&steamid=' + settings.steamid +
			'&relationship=friend', false);
	friends_r.onload = function(){
		if(this.status != 200) return;
		friendscount = JSON.parse(this.responseText)['friendslist']['friends'];
	};
	user_r.send(payload);
	friends_r.send();


	var i=0;
	for (i=0; i< players.length; i++) {
		players[i]['gamecount'] = settings.totalgames;
		players[i]['friendcount'] = friendcount;
		if(players[i]['personastate'] < 7)
			players[i]['personastate'] = ['Offline', "Online", 'Busy', "Away",
				"Snooze", "Looking to trade", "Looking to play"][players[i]['personastate']];
	}
	var recent_games = {}, games_array = [];
	for (i=0; i < this.recent_games_nodelist.length; i++) {
		var game = this.recent_games_nodelist[i].parentNode;
		var game_data = {"name": game.getElementsByTagName('name').item(0).firstChild.nodeValue,
   			"logo": game.getElementsByTagName('logo').item(0).firstChild.nodeValue,
      			"storeLink": game.getElementsByTagName('storeLink').item(0).firstChild.nodeValue,
   			"hoursLast2Weeks": game.getElementsByTagName('hoursLast2Weeks').item(0).firstChild.nodeValue,
			"hoursOnRecord": game.getElementsByTagName('hoursOnRecord').item(0).firstChild.nodeValue };
		games_array.push(game_data);
	}
	context.recent_games = games_array;
	return context;
}
*/
define(function(){return steam;});
