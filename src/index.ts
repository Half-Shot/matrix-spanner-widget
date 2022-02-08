import { startWidget } from "./widget";

window.onload = () => {
    startWidget(
        document.getElementsByTagName('main')[0],
        new URLSearchParams(window.location.search),
    )
}