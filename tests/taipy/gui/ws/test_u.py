from taipy.gui import Gui, Markdown


def ws_u_assert_template(gui, helpers, value_before_update, value_after_update, payload):
    # Bind test variable
    assert gui.bind_var_val("var", value_before_update)
    # Bind a page so that the variable will be evaluated as expression
    gui.add_page("test", Markdown("<|{var}|>"))
    gui.run(run_server=False)
    assert gui.var == value_before_update
    flask_client = gui._server.test_client()
    # Get the jsx once so that the page will be evaluated -> variable will be registered
    flask_client.get("/flask-jsx/test/")
    # WS client and emit
    ws_client = gui._server._ws.test_client(gui._server)
    ws_client.emit("message", {"type": "U", "name": "var", "payload": payload})
    assert gui.var == value_after_update
    # assert for received message (message that would be sent to the frontend client)
    received_message = ws_client.get_received()[0]
    helpers.assert_outward_ws_message(received_message, "MU", "var", value_after_update)


def test_ws_u_string(gui: Gui, helpers):
    value_before_update = "a random string"
    value_after_update = "a random string is added"
    payload = value_after_update
    ws_u_assert_template(gui, helpers, value_before_update, value_after_update, payload)


def test_ws_u_number(gui: Gui, helpers):
    value_before_update = 10
    value_after_update = 11
    payload = str(value_after_update)
    ws_u_assert_template(gui, helpers, value_before_update, value_after_update, payload)