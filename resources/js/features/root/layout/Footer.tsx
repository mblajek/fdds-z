import {cx} from "components/utils";
import {VoidComponent} from "solid-js";
import s from "./style.module.scss";

export const Footer: VoidComponent = () => {
  return (
    <footer class={cx(s.footer)}>
      <div id="copyright">Copyright ©2023 nie mam pojęcia jak działa copyright</div>
      <div id="version">Memo Version: 0.0 Alpha</div>
    </footer>
  );
};
