import { startWidget } from "./widget";

window.onload = () => {
    const search = new URLSearchParams(window.location.search);
    const clientTheme = search.get("clientTheme");
    document.querySelector('body')?.setAttribute('class', `theme-${clientTheme}`);

    startWidget(
        document.getElementsByTagName('main')[0],
        search,
    )
}