(function (window) {
    "use strict";
    function setupSegment(settings) {
        window.analytics = window.analytics || [];
        window.analytics.methods = [
            "identify",
            "group",
            "track",
            "page",
            "pageview",
            "alias",
            "ready",
            "on",
            "once",
            "off",
            "trackLink",
            "trackForm",
            "trackClick",
            "trackSubmit"
        ];
        window.analytics.factory = function (method) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(method);
                window.analytics.push(args);
                return window.analytics;
            };
        };
        for (var i = 0; i < window.analytics.methods.length; i++) {
            var key = window.analytics.methods[i];
            window.analytics[key] = window.analytics.factory(key);
        }
        window.analytics.load = function (key) {
            if (document.getElementById("analytics-js"))
                return;
            loadJS("//cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js", { id: "analytics-js" });
        };
        // Add a version to keep track of what's in the wild.
        window.analytics.SNIPPET_VERSION = "2.0.9";
        // Load Analytics.js with your key, which will automatically
        // load the tools you've enabled for your account. Boosh!
        window.analytics.load(settings["write_key"]);
        // Make the first page call to load the integrations. If
        // you'd like to manually name or tag the page, edit or
        // move this call however you'd like.
        window.analytics.page({ title: "Syteup" });
    }
    exportPlugin({ setup: setupSegment }, "segment");
}(window));(function (window) {
    "use strict";
    function setupRss(settings) {
        var rss = document.createElement("link");
        rss.rel = "alternate";
        rss.type = "application/rss+xml";
        rss.title = "RSS";
        rss.href = settings["url"];
        document.head.appendChild(rss);
    }
    exportPlugin({ setup: setupRss }, "rss");
}(window));(function (window) {
    "use strict";
    function setupControlPanel(settings) {
        var style = document.createElement("style");
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
        style.sheet.insertRule(".control-panel-btn { display: inline-block; margin: 5px;}", 0);
        style.sheet.insertRule(".control-panel-btn a { line-height: 25px; padding: 5px; margin: 0; border: solid 1px;}", 0);
        style.sheet.insertRule(".control-panel-btn a.clicked {background-color: green}", 0);
        style.sheet.insertRule(".control-panel-btn a.unclicked {background-color: red}", 0);
        $("body").bind("blog-post-loaded", function () {
            if (!$("#control-panel")[0])
                return;
            $.each($(".main-nav li a"), function (i, e) {
                $("#control-panel").append("<div class='control-panel-btn'><a class='clicked' data-id='" + e.id + "'>#" + e.id + "</a></div>");
            });
            $(".control-panel-btn a").click(function () {
                var id = this.dataset["id"];
                if (this.className === "clicked") {
                    this.className = "unclicked";
                    $("#" + id).parent().hide(300);
                } else {
                    this.className = "clicked";
                    $("#" + id).parent().show(300);
                }
            });
            $("#control-panel").removeAttr("id");
        });
    }
    exportPlugin({ setup: setupControlPanel }, "control_panel");
}(window));(function (window) {
    "use strict";
    function setup(settings) {
        window.grtpAPI = "https://grtp.co/v1/";
        loadJS("//grtp.co/v1.js", {}, { gratipayUsername: settings.username }, document.getElementById("header-widgets"));
    }
    exportPlugin({ setup: setup }, "gratipay_widget");
}(window));(function (window) {
    "use strict";
    function setup(settings) {
        var form = document.createElement("form");
        form.action = "https://www.paypal.com/cgi-bin/webscr";
        form.method = "post";
        form.target = "_top";
        form.innerHTML = "<input type=\"hidden\" name=\"cmd\" value=\"_s-xclick\">" + "<input type=\"hidden\" name=\"encrypted\" value=\"" + settings["encrypted"] + "\">" + "<input type=\"image\" src=\"https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif\" border=\"0\" name=\"submit\" alt=\"PayPal - The safer, easier way to pay online!\">" + "<img alt=\"\" border=\"0\" src=\"https://www.paypalobjects.com/en_US/i/scr/pixel.gif\" width=\"1\" height=\"1\">";
        document.getElementById("header-widgets").appendChild(form);
    }
    exportPlugin({ setup: setup }, "paypal_donate");
}(window));(function (window) {
    /* global DISQUS */
    "use strict";
    function embedDisqus(settings) {
        var type = "embed";
        if (settings.just_count)
            type = "count";
        loadJS("//" + settings.shortname + ".disqus.com/" + type + ".js");
        $(document).on("click", ".disqus_show_comments", function () {
            var old = $("#disqus_thread");
            if (old.length) {
                old[0].className = "disqus_show_comments";
                old[0].id = "";
                old.append($("<a>Show Comments</a>"));
            }
            this.innerHTML = "";
            this.className = "disqus-thread";
            this.id = "disqus_thread";
            $(this).append($("<a href='/post/" + this.dataset.id + "#disqus_thread' class='comments'></a>"));
            var data = this.dataset;
            DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = data.id;
                    this.page.url = window.location.origin + window.location.pathname + "#!post/" + data.id;
                    this.language = "en";
                }
            });
        });
    }
    function setupDisqus(settings) {
        window.disqus_enabled = true;
        window.disqus_just_count = settings["just_count"];
        window.disqus_shortname = settings["shortname"];
        $("body").bind("blog-post-loaded", function () {
            embedDisqus(settings);
        });
    }
    exportPlugin({ setup: setupDisqus }, "disqus");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Dribbble";
    var API_URL = "https://api.dribbble.com/players/";
    var BASE_URL = "https://dribbble.com/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupDribbble(dribbbleData, settings) {
        var user = dribbbleData.shots[0].player;
        user.following_count = numberWithCommas(user.following_count);
        user.followers_count = numberWithCommas(user.followers_count);
        user.likes_count = numberWithCommas(user.likes_count);
        return {
            "user": user,
            "shots": dribbbleData.shots
        };
    }
    function fetchData(settings) {
        return asyncGet(API_URL + settings.username + "/shots");
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "dribbble.html",
        getURL: getURL,
        setup: setupDribbble,
        fetch: fetchData
    }, "dribbble");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Flickr";
    var BASE_URL = "https://www.flickr.com/photos/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupFlickr(flickrData, settings) {
        if (flickrData.items === 0) {
            return;
        }
        flickrData.title = flickrData.title.substring(13);
        $.each(flickrData.items, function (i, p) {
            p.formated_date = moment.unix(Date.parse(p.date_taken) / 1000).fromNow();
        });
        return flickrData;
    }
    function fetchData(settings) {
        return asyncGet("http://api.flickr.com/services/feeds/photos_public.gne?id=" + settings.user_id + "&format=json&lang=en-us", undefined, "jsoncallback");
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "flickr.html",
        getURL: getURL,
        setup: setupFlickr,
        fetch: fetchData
    }, "flickr");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Bitbucket";
    var API_URL = "https://api.bitbucket.org/1.0/";
    var BASE_URL = "https://bitbucket.org/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupBitbucket(bitbucketData, settings) {
        bitbucketData.user.followers = numberWithCommas(bitbucketData.user.followers);
        return bitbucketData;
    }
    function fetchData(settings) {
        var context = {};
        return Promise.all([
            asyncGet(API_URL + "users/" + settings.username + "?jsoncallback=mainRequest"),
            asyncGet(API_URL + "users/" + settings.username + "/followers?jsoncallback=followersRequest")
        ]).then(function (res) {
            context = res[0];
            context["user"]["followers"] = res[1]["count"];
            context["user"]["public_repos"] = context["repositories"].length;
            context["repositories"].sort(function (r1, r2) {
                return r1.utc_last_updated < r2.utc_last_updated;
            });
            if (settings.show_forks) {
                return Promise.all(context["repositories"].map(function (repo) {
                    return asyncGet(API_URL + "repositories/" + settings.username + "/" + repo["slug"] + "?jsoncallback=forksRequest");
                })).then(function (forks) {
                    var i = 0;
                    forks.forEach(function (fork) {
                        context["repositories"][i++]["forks_count"] = fork["forks_count"];
                    });
                    return Promise.resolve(context);
                });
            } else {
                return Promise.resolve(context);
            }
        });
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "bitbucket.html",
        getURL: getURL,
        setup: setupBitbucket,
        fetch: fetchData
    }, "bitbucket");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Last.fm";
    var API_URL = "https://ws.audioscrobbler.com/2.0/";
    var BASE_URL = "https://www.last.fm/user/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupLastfm(lastfmData, settings) {
        /* Add extra helper to parse out the #text fields in context passed to
         * handlebars.  The '#' character is reserved by the handlebars templating
         * language itself so cannot reference '#text' easily in the template. */
        Handlebars.registerHelper("text", function (obj) {
            try {
                return obj["#text"];
            } catch (err) {
                return "";
            }
        });
        Handlebars.registerHelper("image_url", function (obj) {
            try {
                return obj[0]["#text"];
            } catch (err) {
                return "";
            }
        });
        Handlebars.registerHelper("avatar_url", function (obj) {
            try {
                return obj[1]["#text"];
            } catch (err) {
                return "";
            }
        });
        lastfmData.user_info.user.formatted_plays = numberWithCommas(lastfmData.user_info.user.playcount);
        lastfmData.user_info.user.formatted_playlists = numberWithCommas(lastfmData.user_info.user.playlists);
        lastfmData.user_info.user.formatted_register_date = moment.utc(lastfmData.user_info.user.registered["#text"], "YYYY-MM-DD HH:mm").format("MM/DD/YYYY");
        $.each(lastfmData.recenttracks.recenttracks.track, function (i, t) {
            // Lastfm can be really finicky with data and return garbage if
            // the track is currently playing
            var date;
            try {
                date = t.date["#text"];
            } catch (err) {
                t.formatted_date = "Now Playing";
                return true;    // equivalent to "continue" with a normal for loop
            }
            t.formatted_date = moment.utc(date, "DD MMM YYYY, HH:mm").fromNow();
        });
        return lastfmData;
    }
    function fetchData(settings) {
        return Promise.all([
            asyncGet(API_URL + "?method=user.getinfo&user=" + settings.username + "&format=json&api_key=" + settings.api_key),
            asyncGet(API_URL + "?method=user.getrecenttracks&user=" + settings.username + "&format=json&api_key=" + settings.api_key)
        ]).then(function (res) {
            return Promise.resolve({
                user_info: res[0],
                recenttracks: res[1]
            });
        });
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "lastfm.html",
        getURL: getURL,
        setup: setupLastfm,
        fetch: fetchData
    }, "lastfm");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Youtube";
    var API_URL = "https://www.googleapis.com/youtube/v3/";
    var BASE_URL = "https://www.youtube.com/user/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupYoutube(youtubeData, settings) {
        if (youtubeData.message || youtubeData.activities.length === 0) {
            return;
        }
        youtubeData.statistics.url = BASE_URL + settings.username;
        youtubeData.channel.url = BASE_URL + settings.username;
        $.each(youtubeData.activities, function (i, t) {
            t.publishedAt = moment.utc(t.publishedAt, "YYYY-MM-DD HH:mm:ss").fromNow();
            t.img = t.thumbnails["default"].url;
            if (t.type === "playlistItem")
                t.type = "add to playlist";
            else if (t.type === "bulletin")
                t.type = "post";
        });
        return youtubeData;
    }
    function fetchData(settings) {
        var context = {};
        return asyncGet(API_URL + "channels?part=statistics%2Csnippet&forUsername=" + settings.username + "&key=" + settings.api_key).then(function (channels) {
            context.channel = channels["items"][0]["snippet"];
            context.statistics = channels["items"][0]["statistics"];
            context.id = channels["items"][0]["id"];
            context.username = settings.username;
            return asyncGet(API_URL + "activities?part=snippet%2CcontentDetails&channelId=" + context.id + "&maxResults=20&fields=items(contentDetails%2Csnippet)%2CnextPageToken&key=" + settings.api_key).then(function (activities) {
                context.next_page = activities["nextPageToken"];
                context.activities = activities["items"].map(function (item) {
                    var resource = item["contentDetails"][item["snippet"]["type"]];
                    if ("videoId" in resource)
                        item["snippet"]["url"] = "https://www.youtube.com/watch?v=" + resource["videoId"];
                    else if (resource["resourceId"]["channelId"])
                        item["snippet"]["url"] = "https://www.youtube.com/channel/" + resource["resourceId"]["channelId"];
                    else if (resource["resourceId"]["videoId"])
                        item["snippet"]["url"] = "https://www.youtube.com/watch?v=" + resource["resourceId"]["videoId"];
                    return item["snippet"];
                });
                return Promise.resolve(context);
            });
        });
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "youtube.html",
        getURL: getURL,
        setup: setupYoutube,
        fetch: fetchData
    }, "youtube");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "SoundCloud";
    var API_URL = "https://api.soundcloud.com/";
    var BASE_URL = "https://soundcloud.com/";
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupSoundcloud(soundcloudData, settings) {
        return soundcloudData;
    }
    function fetchData(settings) {
        return Promise.all([
            asyncGet(API_URL + "users/" + settings.username + ".json?client_id=" + settings.client_id),
            asyncGet(API_URL + "users/" + settings.username + "/tracks.json?client_id=" + settings.client_id)
        ]).then(function (res) {
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
    exportService({
        displayName: DISPLAY_NAME,
        template: "soundcloud.html",
        getURL: getURL,
        setup: setupSoundcloud,
        fetch: fetchData
    }, "soundcloud");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Instagram";
    var API_URL = "https://api.instagram.com/v1/";
    var BASE_URL = "http://instagram.com/";
    var nextId;
    function getURL(settings) {
        return BASE_URL + settings.username;
    }
    function setupInstagram(instagramData, settings) {
        if (instagramData.media === 0) {
            return;
        }
        var user_counts = instagramData.user["counts"];
        user_counts.media = numberWithCommas(user_counts.media);
        user_counts.followed_by = numberWithCommas(user_counts.followed_by);
        user_counts.follows = numberWithCommas(user_counts.follows);
        $.each(instagramData.media, function (i, p) {
            p.formated_date = moment.unix(parseInt(p.created_time)).fromNow();
        });
        return instagramData;
    }
    function setupInstagramMore(instagramData, settings) {
        $.each(instagramData.media, function (i, p) {
            p.formated_date = moment.unix(parseInt(p.created_time)).fromNow();
        });
        return instagramData;
    }
    function fetchData(settings) {
        return Promise.all([
            asyncGet(API_URL + "users/" + settings.user_id + "/?access_token=" + settings.access_token),
            asyncGet(API_URL + "users/" + settings.user_id + "/media/recent/?access_token=" + settings.access_token)
        ]).then(function (res) {
            nextId = res[1]["pagination"]["next_max_id"];
            return Promise.resolve({
                "pagination": res[1]["pagination"]["next_max_id"],
                "media": res[1]["data"],
                "user": res[0].data
            });
        });
    }
    function fetchMore(settings) {
        if (nextId)
            return asyncGet(API_URL + "users/" + settings.user_id + "/media/recent/?access_token=" + settings.access_token + "&max_id=" + nextId).then(function (res) {
                nextId = res["pagination"]["next_max_id"];
                return Promise.resolve({
                    "media": res["data"],
                    "pagination": nextId
                });
            });
        else
            return Promise.reject(NO_MORE_DATA);
    }
    exportService({
        displayName: DISPLAY_NAME,
        template: "instagram.html",
        templateMore: "instagram-more.html",
        getURL: getURL,
        setup: setupInstagram,
        fetch: fetchData,
        supportMore: true,
        fetchMore: fetchMore,
        setupMore: setupInstagramMore
    }, "instagram");
}(window));(function (window) {
    "use strict";
    var DISPLAY_NAME = "Contact";
    function getURL(settings) {
        return "mailto:" + settings.email;
    }
    function setupContact(data, settings) {
        if (data.tel)
            data.tel_uri = "tel:+" + data.tel.match(/\((.*)\) (.*)/).slice(1).join("");
        if (data.mobile)
            data.mobile_uri = "tel:+" + data.mobile.match(/\((.*)\) (.*)/).slice(1).join("");
        if (data.fax)
            data.fax_uri = "fax:+" + data.fax.match(/\((.*)\) (.*)/).slice(1).join("");
        return data;
    }
    function fetchContact(settings) {
        var context = [];
        if (settings.pgp_url)
            context.push(asyncText(settings.pgp_url));
        if (settings.ssh_url)
            context.push(asyncText(settings.ssh_url));
        if (context.length > 0) {
            return Promise.all(context).then(function (res) {
                var data = settings;
                if (settings.pgp_url) {
                    data.pubkey = res[0];
                    data.sshkey = res[1];
                } else {
                    data.sshkey = res[0];
                }
                return Promise.resolve(data);
            });
        } else {
            return Promise.resolve(settings);
        }
    }
    exportService({
        displayName: DISPLAY_NAME,
        getURL: getURL,
        setup: setupContact,
        fetch: fetchContact,
        template: "contact.html"
    }, "contact");
}(window));