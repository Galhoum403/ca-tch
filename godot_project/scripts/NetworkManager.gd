extends Node

signal connected
signal disconnected
signal room_created(code: String)
signal room_state_updated(state: Dictionary)
signal timer_tick(remaining: int)
signal action_announced(data: Dictionary)
signal liar_prompt_received(data: Dictionary)
signal hand_swap_started(data: Dictionary)
signal item_thrown_received(data: Dictionary)
signal chat_bubble_received(data: Dictionary)
signal error_received(message: String)

var ws: WebSocketPeer = WebSocketPeer.new()
var server_url: String = "ws://127.0.0.1:3001"
var is_connected: bool = false
var last_state: Dictionary = {}
var current_room_code: String = ""
var my_name: String = "لاعب"
var my_avatar: String = "👑"

func _ready():
	set_process(true)

func connect_to_server(url: String = "ws://127.0.0.1:3001") -> Error:
	server_url = url
	ws.close()
	is_connected = false
	var err = ws.connect_to_url(server_url)
	if err != OK:
		print("Error connecting: ", err)
	return err

func _process(_delta):
	ws.poll()
	var state = ws.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		if not is_connected:
			is_connected = true
			print("Connected to CATCH VIP Server at: ", server_url)
			emit_signal("connected")

		while ws.get_available_packet_count() > 0:
			var packet = ws.get_packet()
			var text = packet.get_string_from_utf8()
			_handle_message(text)

	elif state == WebSocketPeer.STATE_CLOSING:
		pass
	elif state == WebSocketPeer.STATE_CLOSED:
		if is_connected:
			is_connected = false
			print("Disconnected from server")
			emit_signal("disconnected")

func _handle_message(json_str: String):
	var json = JSON.new()
	var parse_err = json.parse(json_str)
	if parse_err != OK:
		return

	var dict = json.get_data()
	if not (dict is Dictionary):
		return

	var event = dict.get("event", "")
	var data = dict.get("data", {})

	match event:
		"room_created":
			current_room_code = data.get("code", "")
			emit_signal("room_created", current_room_code)
		"room_state":
			last_state = data
			emit_signal("room_state_updated", data)
		"timer_tick":
			emit_signal("timer_tick", int(data.get("remaining", 0)))
		"action_announcement":
			emit_signal("action_announced", data)
		"liar_decision_prompt":
			emit_signal("liar_prompt_received", data)
		"hand_swap_animation":
			emit_signal("hand_swap_started", data)
		"item_thrown":
			emit_signal("item_thrown_received", data)
		"chat_bubble":
			emit_signal("chat_bubble_received", data)
		"error_message":
			emit_signal("error_received", str(data))

func send_event(event_name: String, data: Dictionary = {}):
	if ws.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return
	var msg = {
		"event": event_name,
		"data": data
	}
	var json_str = JSON.stringify(msg)
	ws.send_text(json_str)

func create_room(player_name: String, avatar: String):
	my_name = player_name
	my_avatar = avatar
	send_event("create_room", {"name": player_name, "avatar": avatar})

func join_room(code: String, player_name: String, avatar: String):
	my_name = player_name
	my_avatar = avatar
	current_room_code = code
	send_event("join_room", {"code": code, "name": player_name, "avatar": avatar})

func add_bot():
	send_event("add_bot", {})

func remove_bot():
	send_event("remove_bot", {})

func start_game():
	send_event("start_game", {})

func ask_number(target_idx: int, value: int):
	send_event("ask_number", {"targetIdx": target_idx, "value": value})

func liar_decision(lie: bool):
	send_event("liar_decision", {"lie": lie})

func play_action_card(card_id: String, target_idx: int = -1, value: int = -1):
	var data = {"cardId": card_id}
	if target_idx >= 0:
		data["targetIdx"] = target_idx
	if value >= 0:
		data["value"] = value
	send_event("play_action_card", data)

func draw_card():
	send_event("draw_card", {})

func throw_item(target_idx: int, item_type: String):
	send_event("throw_item", {"targetIdx": target_idx, "itemType": item_type})

func send_quick_chat(text: String, emoji: String = "💬"):
	send_event("quick_chat", {"text": text, "emoji": emoji})

func leave_room():
	send_event("leave_room", {})
