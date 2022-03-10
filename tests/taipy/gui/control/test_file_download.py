import os
import pathlib
from importlib import util

from taipy.gui import Gui


def test_file_download_url_md(gui: Gui, helpers):
    gui._bind_var_val("content", "some_url")
    md_string = "<|{content}|file_download|>"
    expected_list = [
        "<FileDownload",
        "content={_TpC_content}",
        'defaultContent="some_url"',
    ]
    helpers.test_control_md(gui, md_string, expected_list)


def test_file_download_file_md(gui: Gui, helpers):
    with open((pathlib.Path(__file__).parent.parent / "resources" / "fred.png").resolve(), "rb") as content:
        gui._bind_var_val("content", content.read())
        md_string = "<|{content}|file_download|>"
        expected_list = [
            "<FileDownload",
            'defaultContent="data:image/png;base64,',
        ]
        if not util.find_spec("magic"):
            expected_list = ["<FileDownload", 'defaultContent="/taipy-content/taipyStatic0/TaiPyContent.', ".bin"]
        helpers.test_control_md(gui, md_string, expected_list)


def test_file_download_path_md(gui: Gui, helpers):
    gui._bind_var_val("content", str((pathlib.Path(__file__).parent.parent / "resources" / "fred.png").resolve()))
    md_string = "<|{content}|file_download|>"
    expected_list = [
        "<FileDownload",
        'defaultContent="/taipy-content/taipyStatic0/fred.png',
    ]
    helpers.test_control_md(gui, md_string, expected_list)


def test_file_download_any_file_md(gui: Gui, helpers):
    with open(os.path.abspath(__file__), "rb") as content:
        gui._bind_var_val("content", content.read())
        md_string = "<|{content}|file_download|>"
        expected_list = [
            "<FileDownload",
            'defaultContent="data:text/x',
            "python;base64,",
        ]
        if not util.find_spec("magic"):
            expected_list = ["<FileDownload", 'defaultContent="/taipy-content/taipyStatic0/TaiPyContent.', ".bin"]
        helpers.test_control_md(gui, md_string, expected_list)


def test_file_download_url_html(gui: Gui, helpers):
    gui._bind_var_val("content", "some_url")
    html_string = '<taipy:file_download content="{content}" />'
    expected_list = [
        "<FileDownload",
        'defaultContent="some_url"',
    ]
    helpers.test_control_html(gui, html_string, expected_list)