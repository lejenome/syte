(function(window) {
    "use strict";
    var DISPLAY_NAME = "SoundCloud";
    var API_URL = "https://api.soundcloud.com/";

    function setupSoundcloud(soundcloudData, settings) {
        return soundcloudData;
    }

    function fetchData(settings) {
        return Promise.all([
            asyncGet(API_URL + "users/" + settings.username + ".json?client_id=" + settings.client_id),
            asyncGet(API_URL + "users/" + settings.username + "/tracks.json?client_id=" + settings.client_id)

        ]).then(function(res) {
            return {
                "user_tracks": {
                    "show_artwork": settings.show_artwork,
                    "player_color": settings.player_color,
                    "tracks": res[1]
                },
                "user_profile": res[0]
            };
        });
    }
    window.soundcloudService = {
        displayName: DISPLAY_NAME,
        template: "soundcloud.html",
        setup: setupSoundcloud,
        fetch: fetchData
    };
})(window);