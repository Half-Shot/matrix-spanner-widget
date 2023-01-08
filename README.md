matrix-spanner-widget
=====================

This project is a [Matrix](https://matrix.org) widget for holding Spanners.

![Screenshot](https://chaotic.half-shot.uk/_matrix/media/r0/download/half-shot.uk/6f284fe34dfa6d7a0389cbb3f747a34539202117)


### Spanners?

Spanners are a concept similar to a Mutex, where you want to (verbally) take control of a resource like a deployment
environment or host to avoid other people from trying to use it at the same time. With this widget, you can click a
button from within your Matrix client to alert the rest of the room that you are about to take control. The widget also
informs you if someone else has already taken control.

### How does it work?

Under the hood, this widget is powered by normal Matrix state. The widget sends and reads `uk.half-shot.spanner` state events,
using a `state_key` to avoid collisions with competing spanners.

The event is very simple, containing only an `{"active": true|false}` content to denote if the spanner is active.

### How do I use it?

You will need a widget compatible Matrix client, such as [Element](https://element.io/) in order to use this. Clients could
also opt to implement the state event natively, but so far no clients have chosen to.

Once you have one of those, you simply need to host this project on a webserver and add the widget to a room as normal.

Building the project is a case of just running `yarn` and then `yarn build`.

half-shot.uk also hosts a instance of this widget, but uptime cannot be guaranteed.

E.g. to add a widget to an Element room you just need to say:

`/addwidget https://spanner.half-shot.uk/?spannerName=YourSpannerName&spannerId=SomeUniqueId&sendSpannerMsg=true|false`

#### URL Parameters

All are optional.

- `clientTheme=$org.matrix.msc2873.client_theme` Match the widget theme to the theme of the client. (You almost certainly want this if you value your eyes).
- `docsLink` A optional link to some documentation about this spanner. I.e. when is it okay to click it.
- `sendSpannerMsg` Send a notice into the room when you take or drop the spanner. Defaults to false.
- `spannerId` The state_key to use, this just needs to be unique. Defaults to `default`.
- `spannerName` The human readable name of your spanner. E.g. "staging%20environment". Defaults to `the Spanner`.


### Docker

Docker images can be found for this project under `ghcr.io/half-shot/matrix-spanner-widget`.

Running the image is as simple as `docker run --name spanner-widget -p 127.0.0.1:8080:8080 ghcr.io/half-shot/matrix-spanner-widget:1.0.0`

### Contact

As always, you can contact me via my MXID: [@Half-Shot:half-shot.uk](https://matrix.to/#/@Half-Shot:half-shot.uk)
