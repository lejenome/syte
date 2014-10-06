"use strict";

function setupInstagram(url, el, settings) {
    var href = el.href;

    if ($("#instagram-profile").length > 0) {
        window.location = href;
        return;
    }

    var spinner = new Spinner(spin_opts).spin();
    $("#instagram-link").append(spinner.el);

    require(["views/instagram.js",
            "text!templates/instagram-view.html",
            "text!templates/instagram-view-more.html"
        ],
        function(instagram, instagram_view, instagram_view_more) {
            settings.max_id = undefined; // if we already showed instagram profile, clean max_id
            instagram(settings).then(function(instagram_data) {
                var $modal;

                if (instagram_data.media === 0) {
                    window.location = href;
                    return;
                }

                var template = Handlebars.compile(instagram_view);
                var user_counts = instagram_data.user["counts"];

                user_counts.media = numberWithCommas(user_counts.media);
                user_counts.followed_by = numberWithCommas(user_counts.followed_by);
                user_counts.follows = numberWithCommas(user_counts.follows);

                $.each(instagram_data.media, function(i, p) {
                    p.formated_date = moment.unix(parseInt(p.created_time)).fromNow();
                });

                $modal = $(template(instagram_data)).modal().on("hidden.bs.modal", function() {
                    $(this).remove();
                    if (currSelection === "instagram") {
                        adjustSelection("home");
                    }
                });

                var more_template = Handlebars.compile(instagram_view_more);

                $modal.find("#load-more-pics").click(function(e) {
                    settings.next_id = $(this).attr("data-control-next");

                    var spinner = new Spinner(spin_opts).spin();
                    $("#load-more-pics").append(spinner.el);
                    instagram(settings).then(function(data) {

                        $.each(data.media, function(i, p) {
                            p.formated_date = moment.unix(parseInt(p.created_time)).fromNow();
                        });

                        $(".instagram .profile-shots").append(more_template(data));

                        if (data.pagination && data.pagination["next_max_id"])
                            $("#load-more-pics").attr("data-control-next", data.pagination["next_max_id"]);
                        else
                            $("#load-more-pics").remove();

                        spinner.stop();
                    });

                });

                spinner.stop();
            });
        });
}
