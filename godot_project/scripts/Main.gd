extends Control

@onready var lobby_panel: Panel = $LobbyPanel
@onready var game_panel: Control = $GamePanel

# Lobby controls
@onready var name_input: LineEdit = $LobbyPanel/Center/VBox/NameInput
@onready var code_input: LineEdit = $LobbyPanel/Center/VBox/CodeInput
@onready var ip_input: LineEdit = $LobbyPanel/Center/VBox/IPInput
@onready var create_btn: Button = $LobbyPanel/Center/VBox/CreateBtn
@onready var join_btn: Button = $LobbyPanel/Center/VBox/JoinBtn
@onready var status_lbl: Label = $LobbyPanel/Center/VBox/StatusLbl

# Room Lobby inside panel
@onready var room_lobby_box: VBoxContainer = $LobbyPanel/Center/VBox/RoomLobbyBox
@onready var room_code_display: Label = $LobbyPanel/Center/VBox/RoomLobbyBox/RoomCodeLbl
@onready var players_list_lbl: Label = $LobbyPanel/Center/VBox/RoomLobbyBox/PlayersListLbl
@onready var add_bot_btn: Button = $LobbyPanel/Center/VBox/RoomLobbyBox/BotButtons/AddBotBtn
@onready var remove_bot_btn: Button = $LobbyPanel/Center/VBox/RoomLobbyBox/BotButtons/RemoveBotBtn
@onready var start_game_btn: Button = $LobbyPanel/Center/VBox/RoomLobbyBox/StartGameBtn

# In-game Table elements
@onready var seats_container: Control = $GamePanel/SeatsContainer
@onready var hand_deck_dock: Control = $GamePanel/BottomDock/HandFanDock
@onready var draw_card_btn: Button = $GamePanel/BottomDock/DrawCardBtn
@onready var deck_btn: Button = $GamePanel/TableCenter/DeckPile/DeckBtn
@onready var deck_count_lbl: Label = $GamePanel/TableCenter/DeckPile/DeckCountLbl
@onready var discard_texture: TextureRect = $GamePanel/TableCenter/DiscardPile/DiscardTexture
@onready var table_log_lbl: Label = $GamePanel/TableCenter/TableLogLbl

# Toast Announcement Banner
@onready var action_toast: PanelContainer = $GamePanel/ActionToast
@onready var toast_title: Label = $GamePanel/ActionToast/Margin/VBox/ToastTitle
@onready var toast_desc: Label = $GamePanel/ActionToast/Margin/VBox/ToastDesc

# Liar Decision Prompt Modal
@onready var liar_modal: PanelContainer = $GamePanel/LiarModal
@onready var liar_msg_lbl: Label = $GamePanel/LiarModal/Margin/VBox/LiarMsg
@onready var liar_truth_btn: Button = $GamePanel/LiarModal/Margin/VBox/Buttons/TruthBtn
@onready var liar_lie_btn: Button = $GamePanel/LiarModal/Margin/VBox/Buttons/LieBtn

# Hand Swap Animation Overlay
@onready var swap_overlay: Control = $GamePanel/SwapOverlay
@onready var swap_card1: TextureRect = $GamePanel/SwapOverlay/SwapCard1
@onready var swap_card2: TextureRect = $GamePanel/SwapOverlay/SwapCard2
@onready var swap_lbl: Label = $GamePanel/SwapOverlay/SwapLbl

# Target Selection Mode
@onready var target_instruction_panel: PanelContainer = $GamePanel/TargetInstructionPanel
@onready var target_instruction_lbl: Label = $GamePanel/TargetInstructionPanel/Margin/InstructionLbl
@onready var cancel_action_btn: Button = $GamePanel/TargetInstructionPanel/Margin/CancelBtn

# Number Picker Dialog
@onready var number_picker_modal: PanelContainer = $GamePanel/NumberPickerModal
@onready var number_picker_title: Label = $GamePanel/NumberPickerModal/Margin/VBox/Title
@onready var number_grid: GridContainer = $GamePanel/NumberPickerModal/Margin/VBox/Grid

# Egyptian Throwables Wheel Popup
@onready var throw_wheel_modal: PanelContainer = $GamePanel/ThrowWheelModal
@onready var throw_target_lbl: Label = $GamePanel/ThrowWheelModal/Margin/VBox/Title

# Quick Egyptian Chat Drawer
@onready var chat_drawer: PanelContainer = $GamePanel/ChatDrawer
@onready var toggle_chat_btn: Button = $GamePanel/ToggleChatBtn

# Flying Projectile Node
@onready var flying_projectile: Label = $GamePanel/FlyingProjectile

# Card template
const CARD_SCENE = preload("res://scenes/Card.tscn")
const SEAT_SCENE = preload("res://scenes/PlayerSeat.tscn")

# Card Inspector elements (db0 Framework Style)
var card_inspector_panel: PanelContainer = null
var inspector_card_img: TextureRect = null
var inspector_title: Label = null
var inspector_cat_lbl: Label = null
var inspector_cat_panel: PanelContainer = null
var inspector_desc: Label = null
var inspector_tip: Label = null

# Live Action Feed HUD elements (شاشة التفاعلات المباشرة)
var live_feed_panel: PanelContainer = null
var live_feed_line1: Label = null
var live_feed_line2: Label = null

const CARD_INSPECTOR_INFO = {
	"number": {
		"title": "كارت أرقام",
		"category": "مجموعة أرقام",
		"desc": "اطلب هذا الرقم من أي خصم في دورك. إذا كان معه الكارت هيعطيه لك فوراً، ولو معاه أكتر من كارت هتاخدهم كلهم! جمع 4 كروت لتكوين سيت (لمّة) ونقاط فوز.",
		"tip": "💡 راقب طلبات الخصوم لتعرف مين معاه أرقامك واستهدفهم!"
	},
	"card_CA": {
		"title": "كارت كا (11)",
		"category": "كارت خاص نادر",
		"desc": "كارت الحروف الأول. سيت 'كا' يتكون من 4 كروت (أو 3 + جوكر). يعطيك 11 نقطة كاملة عند تكوينه!",
		"tip": "💡 احتفظ به واطلب 'كا' لما تتأكد إن في لاعب سحبه!"
	},
	"card_TCH": {
		"title": "كارت تش (12)",
		"category": "كارت خاص نادر",
		"desc": "كارت الحروف الثاني والأعلى قيمة في اللعبة. سيت 'تش' يمنحك 12 نقطة فوز!",
		"tip": "💡 كروت الحروف هي مفتاح الفوز بالجولات الحاسمة."
	},
	"magnatees": {
		"title": "مغناطيس",
		"category": "أكشن هجومي خارق",
		"desc": "اختر أي رقم موجود في إيدك.. المغناطيس هيسحب كل الكروت من هذا الرقم من جميع اللاعبين في نفس اللحظة!",
		"tip": "💡 العبه لما تجمع كارتين أو تلاتة من رقم وتطلب من الكل عشان تقفل السيت فوراً!"
	},
	"special": {
		"title": "اسبيشيال",
		"category": "أكشن هجومي حر",
		"desc": "يسمح لك بطلب أي رقم في اللعبة حتى لو مش معاك في إيدك من أي لاعب تختاره!",
		"tip": "💡 استخدمه لسرقة الأرقام اللي شوفت خصمك بيجمعها!"
	},
	"el3ab_tani": {
		"title": "العب تاني",
		"category": "أكشن تكتيكي",
		"desc": "يمنحك دوراً إضافياً فورياً! العب مرة تانية واطلب كارت جديد بدون تمرير الدور.",
		"tip": "💡 فرصة ذهبية لمواصلة الهجوم ومفاجأة الخصوم."
	},
	"od_le7afak": {
		"title": "قد لحافك",
		"category": "أكشن سرقة سيت",
		"desc": "اسرق سيت (لمّة) كاملة مجمعة عند أي لاعب، بشرط يكون رقم السيت مساوياً تماماً لعدد الكروت المتبقية في إيدك!",
		"tip": "💡 خطط لعدد كروت إيدك بدقة لتستولي على أعلى سيت عند المتصدر!"
	},
	"badl_edain": {
		"title": "بدل إيدي",
		"category": "أكشن قلب الطاولة",
		"desc": "بدل كل كروت إيدك فوراً مع أي لاعب تختاره، أو بدل كروت لاعبين اتنين ببعض!",
		"tip": "💡 لو إيدك فاضية أو كروتك ضعيفة، بدلها مع اللاعب اللي مجمع كروت كتيرة!"
	},
	"bos_bosa": {
		"title": "بص بصة",
		"category": "أكشن استطلاع",
		"desc": "اكشف كارت سري عشوائي من إيد أي لاعب لتكشف استراتيجيته وتعرف ماذا يملك.",
		"tip": "💡 استطلع كروت اللاعب التالي لتعرف هل يستهدفك أم لا."
	},
	"sayad": {
		"title": "صياد",
		"category": "أكشن صيد",
		"desc": "اسحب كارت عشوائي من إيد أي لاعب وضمه لإيدك فوراً.",
		"tip": "💡 يقلل كروت الخصم ويزيد كروتك بدون شروط."
	},
	"hat_enta": {
		"title": "هات انت",
		"category": "أكشن دفاعي عاكس",
		"desc": "اعكس الطلب! لما حد يطلب منك رقم، ارمي 'هات انت' وخد انت الرقم منه بدلاً منه!",
		"tip": "💡 أفضل مفاجأة ضد من يحاول سرقة أرقامك القوية."
	},
	"kefaya_3leik": {
		"title": "كفاية عليك",
		"category": "أكشن إيقاف قاطع",
		"desc": "أوقف أي لاعب فوراً بعد أول طلب ناجح وانهي دوره ليتحول الدور للاعب التالي.",
		"tip": "💡 احرم الخصم من مواصلة سلسلة طلباته الناجحة."
	},
	"joker": {
		"title": "جوكر",
		"category": "كارت ذهبي جوكر",
		"desc": "يكمل أي سيت ناقص! لو معاك 3 كروت من نفس الرقم والجوكر، يتحول لسيت كامل فوراً.",
		"tip": "💡 سلاحك السري لتحقيق الفوز بأسرع وقت."
	},
	"msh_shaifak": {
		"title": "مش شايفك",
		"category": "أكشن تجميد دور",
		"desc": "جمّد أي لاعب تختاره وميلعبش دوره القادم ويعدي عليه الدور!",
		"tip": "💡 عطل المتصدر أو اللاعب الجالس قبلك مباشرة."
	},
	"kdab": {
		"title": "كداب",
		"category": "أكشن خداع وتضليل",
		"desc": "مسموحلك تكذب وتقول 'معيش' لما حد يطلب منك رقم حتى لو كان معاك في إيدك فعلاً!",
		"tip": "💡 احمي أرقامك الحاسمة واخدع الخصم حتى يظن أنك لا تملكها."
	},
	"mana3a": {
		"title": "مناعة",
		"category": "درع حماية كاملة",
		"desc": "حماية تامة راوند كامل من كل طلبات وسرقات الخصوم (ما عدا كارت المغناطيس الخارق).",
		"tip": "💡 فعّلها لما تكون قريب من تكوين أطقم متعددة لحماية إيدك."
	},
	"lef_w_erga3": {
		"title": "لف وارجع",
		"category": "عكس مسار اللعب",
		"desc": "اعكس اتجاه دوران اللعب فوراً من عقارب الساعة إلى عكسها أو العكس!",
		"tip": "💡 انقذ نفسك وحوّل الدور للاعب بعيد عنك."
	},
	"herbaiya": {
		"title": "الحرباية",
		"category": "أكشن ناسخ متعدد",
		"desc": "قلد أي كارت أكشن نزل على الأرض مؤخراً ونفذ تأثيره كما هو، أو اسرق كارت أكشن من خصمك!",
		"tip": "💡 استخدم أقوى أكشن لعبه غيرك لصالحك مجاناً."
	}
}

var selected_card_control = null
var pending_action_type: String = ""
var pending_action_card_id: String = ""
var pending_number: int = -1
var pending_throw_target: int = -1
var current_room_state: Dictionary = {}
var seat_nodes = []
var card_nodes = []

func _ready():
	lobby_panel.visible = true
	game_panel.visible = false
	room_lobby_box.visible = false
	action_toast.visible = false
	liar_modal.visible = false
	swap_overlay.visible = false
	target_instruction_panel.visible = false
	number_picker_modal.visible = false
	throw_wheel_modal.visible = false
	chat_drawer.visible = false
	draw_card_btn.visible = false
	flying_projectile.visible = false

	# Dynamic texture fixes: ensure table and card back always render perfectly
	var table_tex = TextureHelper.get_tex("res://table_board.png")
	if table_tex:
		$GamePanel/TableBackground.texture = table_tex
	
	var back_tex = TextureHelper.get_tex("res://cards/card_back.png")
	if back_tex:
		$GamePanel/TableCenter/DeckPile/DeckTex.texture = back_tex
	
	# Transparent bottom dock so it doesn't block player seats or table art
	$GamePanel/BottomDock.add_theme_stylebox_override("panel", StyleBoxEmpty.new())

	# Setup buttons
	create_btn.pressed.connect(_on_create_room_pressed)
	join_btn.pressed.connect(_on_join_room_pressed)
	add_bot_btn.pressed.connect(_on_add_bot_pressed)
	remove_bot_btn.pressed.connect(_on_remove_bot_pressed)
	start_game_btn.pressed.connect(_on_start_game_pressed)
	cancel_action_btn.pressed.connect(_cancel_selection_mode)
	liar_truth_btn.pressed.connect(func(): _on_liar_choice(false))
	liar_lie_btn.pressed.connect(func(): _on_liar_choice(true))
	deck_btn.pressed.connect(_on_draw_btn_pressed)
	draw_card_btn.pressed.connect(_on_draw_btn_pressed)
	toggle_chat_btn.pressed.connect(func(): chat_drawer.visible = !chat_drawer.visible)

	_setup_card_inspector()
	_setup_live_action_feed()
	_setup_number_picker_grid()
	_setup_throwing_wheel()
	_setup_quick_chat_phrases()

	# NetworkManager signals
	NetworkManager.connected.connect(_on_network_connected)
	NetworkManager.disconnected.connect(_on_network_disconnected)
	NetworkManager.room_created.connect(_on_room_created)
	NetworkManager.room_state_updated.connect(_on_room_state_updated)
	NetworkManager.timer_tick.connect(_on_timer_tick)
	NetworkManager.action_announced.connect(_show_action_toast)
	NetworkManager.liar_prompt_received.connect(_show_liar_prompt)
	NetworkManager.hand_swap_started.connect(_play_hand_swap_animation)
	NetworkManager.item_thrown_received.connect(_on_item_thrown)
	NetworkManager.chat_bubble_received.connect(_on_chat_bubble)
	NetworkManager.error_received.connect(_on_error_received)

func _setup_number_picker_grid():
	_build_number_picker_buttons("اختر رقماً", false)

func _show_number_picker(title_text: String, is_magnet: bool = false):
	_build_number_picker_buttons(title_text, is_magnet)
	number_picker_modal.visible = true

func _build_number_picker_buttons(title_text: String, is_magnet: bool):
	if number_picker_title:
		number_picker_title.text = title_text
	for child in number_grid.get_children():
		child.queue_free()

	# Count numbers in hand
	var my_idx = int(current_room_state.get("myPlayerIndex", 0))
	var players = current_room_state.get("players", [])
	var hand_nums = {}
	if my_idx >= 0 and my_idx < players.size():
		var hand = players[my_idx].get("hand", [])
		for c in hand:
			if str(c.get("type", "")) == "number":
				var v = int(c.get("value", 0))
				hand_nums[v] = hand_nums.get(v, 0) + 1

	for i in range(13):
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(56, 48)
		var num_str = str(i)
		if i == 11: num_str = "كا"
		elif i == 12: num_str = "تش"

		if hand_nums.has(i):
			btn.text = num_str + "\n(معاك %d)" % hand_nums[i]
			var sb = StyleBoxFlat.new()
			sb.bg_color = Color(0.35, 0.22, 0.05, 0.95)
			sb.border_color = Color(1.0, 0.85, 0.2, 1.0)
			sb.set_border_width_all(2)
			sb.set_corner_radius_all(8)
			btn.add_theme_stylebox_override("normal", sb)
			btn.add_theme_color_override("font_color", Color(1.0, 0.92, 0.35))
		else:
			btn.text = num_str

		var val = i
		btn.pressed.connect(func(): _on_number_picked(val))
		number_grid.add_child(btn)

func _setup_throwing_wheel():
	var items = [
		{"type": "tea", "name": "☕ شاي بالنعناع"},
		{"type": "slipper", "name": "🩴 شبشب طائر"},
		{"type": "tomato", "name": "🍅 طماطم"},
		{"type": "bomb", "name": "💣 قنبلة"},
		{"type": "rocket", "name": "🚀 صاروخ"},
		{"type": "heart", "name": "❤️ بوسة وقلب"}
	]
	var grid = $GamePanel/ThrowWheelModal/Margin/VBox/Grid
	for item in items:
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(130, 42)
		btn.text = item.name
		var itype = item.type
		btn.pressed.connect(func():
			throw_wheel_modal.visible = false
			if pending_throw_target >= 0:
				NetworkManager.throw_item(pending_throw_target, itype)
		)
		grid.add_child(btn)

	var cancel_btn = $GamePanel/ThrowWheelModal/Margin/VBox/CancelBtn
	cancel_btn.pressed.connect(func(): throw_wheel_modal.visible = false)

func _setup_quick_chat_phrases():
	var phrases = [
		{"text": "على مين يا كداب! 🤥", "emoji": "🤥"},
		{"text": "يا حلاوة اللِمّة! 🔥", "emoji": "🔥"},
		{"text": "وراك وراك يا برنس 🎯", "emoji": "🎯"},
		{"text": "مش شايفك يا بصلة 🙈", "emoji": "🙈"},
		{"text": "هات يا عم متستعبطش 🤲", "emoji": "🤲"},
		{"text": "العب يا نجم مستنيينك ⏳", "emoji": "⏳"},
		{"text": "حظك في السما يا معلم 🚀", "emoji": "🚀"},
		{"text": "شاي بالنعناع عشان تروق ☕", "emoji": "☕"}
	]
	var list_box = $GamePanel/ChatDrawer/Margin/VBox/Scroll/PhrasesBox
	for p in phrases:
		var btn = Button.new()
		btn.custom_minimum_size = Vector2(0, 36)
		btn.text = p.emoji + " " + p.text
		var ptext = p.text
		var pemoji = p.emoji
		btn.pressed.connect(func():
			chat_drawer.visible = false
			NetworkManager.send_quick_chat(ptext, pemoji)
		)
		list_box.add_child(btn)

func _on_create_room_pressed():
	status_lbl.text = "جارٍ الاتصال بالسيرفر..."
	var ip = ip_input.text.strip_edges()
	if ip == "":
		ip = "127.0.0.1:3001"
	NetworkManager.connect_to_server("ws://" + ip)
	await NetworkManager.connected
	var p_name = name_input.text.strip_edges()
	if p_name == "":
		p_name = "البرنس"
	NetworkManager.create_room(p_name, "👑")

func _on_join_room_pressed():
	var code = code_input.text.strip_edges().to_upper()
	if code == "":
		status_lbl.text = "الرجاء إدخال كود الغرفة!"
		return
	status_lbl.text = "جارٍ الاتصال بالسيرفر..."
	var ip = ip_input.text.strip_edges()
	if ip == "":
		ip = "127.0.0.1:3001"
	NetworkManager.connect_to_server("ws://" + ip)
	await NetworkManager.connected
	var p_name = name_input.text.strip_edges()
	if p_name == "":
		p_name = "اللاعب"
	NetworkManager.join_room(code, p_name, "🎮")

func _on_add_bot_pressed():
	NetworkManager.add_bot()

func _on_remove_bot_pressed():
	NetworkManager.remove_bot()

func _on_start_game_pressed():
	NetworkManager.start_game()

# Strict Draw Rule: Forbidden if holding numbers!
func _on_draw_btn_pressed():
	var is_my_turn = bool(current_room_state.get("isMyTurn", false))
	if not is_my_turn:
		_show_toast_simple("ليس دورك الآن!")
		return

	# Check if player holds number cards
	var my_idx = int(current_room_state.get("myPlayerIndex", 0))
	var players = current_room_state.get("players", [])
	if my_idx >= 0 and my_idx < players.size():
		var my_hand = players[my_idx].get("hand", [])
		var has_numbers = false
		for c in my_hand:
			if str(c.get("type", "")) == "number":
				has_numbers = true
				break
		if has_numbers:
			_show_toast_simple("🚫 ممنوع تسحب كارت ومعاك أرقام! لازم تطلب رقم من كروتك.")
			return

	NetworkManager.draw_card()

func _on_network_connected():
	status_lbl.text = "تم الاتصال بنجاح!"

func _on_network_disconnected():
	status_lbl.text = "انقطع الاتصال بالسيرفر."

func _on_room_created(code: String):
	room_lobby_box.visible = true
	room_code_display.text = "كود الغرفة: " + code
	status_lbl.text = "تم إنشاء الغرفة! شارك الكود مع أصدقائك."

func _on_error_received(msg: String):
	_show_toast_simple("خطأ: " + msg)

func _on_room_state_updated(state: Dictionary):
	current_room_state = state
	var status = state.get("status", "lobby")

	if status == "lobby":
		lobby_panel.visible = true
		game_panel.visible = false
		room_lobby_box.visible = true
		room_code_display.text = "كود الغرفة: " + str(state.get("code", ""))

		var players = state.get("players", [])
		var p_lines = []
		for p in players:
			p_lines.append(str(p.get("avatar", "👤")) + " " + str(p.get("name", "")) + (" (مضيف)" if p.get("isHost", false) else ""))
		players_list_lbl.text = "\n".join(p_lines)

		var my_idx = int(state.get("myPlayerIndex", 0))
		var is_host = (my_idx >= 0 and my_idx < players.size() and bool(players[my_idx].get("isHost", false)))
		start_game_btn.disabled = (players.size() < 4 or not is_host)

	elif status == "playing" or status == "gameover":
		lobby_panel.visible = false
		game_panel.visible = true
		_update_game_table(state)

func _update_game_table(state: Dictionary):
	var players = state.get("players", [])
	var my_idx = int(state.get("myPlayerIndex", 0))
	var cur_turn_idx = int(state.get("currentIdx", 0))

	# Center Deck
	deck_count_lbl.text = str(state.get("deckCount", 0))

	# Last played discard
	var last_card = state.get("lastPlayedCard", null)
	if last_card != null and (last_card is Dictionary):
		var c_type = str(last_card.get("type", "number"))
		var c_val = last_card.get("value", null)
		var tex_path = ""
		if c_type == "number":
			if c_val == 11:
				tex_path = "res://cards/card_CA.png"
			elif c_val == 12:
				tex_path = "res://cards/card_TCH.png"
			else:
				tex_path = "res://cards/number_%s.png" % str(c_val)
		else:
			tex_path = "res://cards/%s.png" % c_type
		discard_texture.texture = TextureHelper.get_tex(tex_path)

	# Logs & Live Action Feed
	var logs = state.get("logs", [])
	if logs.size() > 0:
		table_log_lbl.text = logs[logs.size() - 1]
	_update_live_action_feed(logs)

	# Layout 4 Seats matching Image 1
	_layout_seats(players, my_idx, cur_turn_idx)

	# Update Hand & Check Drawing rule
	if my_idx >= 0 and my_idx < players.size():
		var my_player = players[my_idx]
		var hand = my_player.get("hand", [])
		_update_hand_fanned(hand)

		var is_my_turn = bool(state.get("isMyTurn", false))
		var has_numbers = false
		for c in hand:
			if str(c.get("type", "")) == "number":
				has_numbers = true
				break

		# STRICT: Show Draw button ONLY if player has NO numbers!
		if is_my_turn and not has_numbers:
			draw_card_btn.visible = true
			draw_card_btn.text = "📥 معندكش أي أرقام! اضغط هنا للسحب وتمرير الدور"
		else:
			draw_card_btn.visible = false

# Exact 4-corner arrangement matching the Catch Video (Image 1)
func _layout_seats(players: Array, my_idx: int, cur_turn_idx: int):
	if seat_nodes.size() != players.size():
		for s in seat_nodes:
			s.queue_free()
		seat_nodes.clear()

		var total = players.size()
		for i in range(total):
			var seat = SEAT_SCENE.instantiate()
			seats_container.add_child(seat)
			seat.target_selected.connect(_on_target_seat_selected)
			seat.throw_item_clicked.connect(_on_seat_throw_clicked)
			seat_nodes.append(seat)

	var total = players.size()
	
	# Positions matching Image 1:
	# Bottom-Left: Local Player (User)
	# Top-Left: Opponent 1
	# Top-Right: Opponent 2
	# Bottom-Right: Opponent 3
	var fixed_4_positions = [
		Vector2(65, 380),   # 0: BL (Self)
		Vector2(65, 75),    # 1: TL (Opponent 1)
		Vector2(1045, 75),  # 2: TR (Opponent 2)
		Vector2(1045, 380)  # 3: BR (Opponent 3)
	]

	for i in range(total):
		var relative_idx = (i - my_idx + total) % total
		var pos = Vector2.ZERO

		if total == 4 and relative_idx < 4:
			pos = fixed_4_positions[relative_idx]
		else:
			# Dynamic arrangement for > 4 players around the diamond
			var center = Vector2(640, 310)
			var radius_x = 490.0
			var radius_y = 220.0
			var angle = (float(relative_idx) / float(total)) * TAU + (PI / 2.0)
			pos = center + Vector2(cos(angle) * radius_x, sin(angle) * radius_y) - Vector2(85, 90)

		var seat = seat_nodes[i]
		seat.position = pos
		var is_self = (i == my_idx)
		seat.update_seat(players[i], i, cur_turn_idx, is_self)

# Luxury Fanned Hand Curve Layout
func _update_hand_fanned(hand_cards: Array):
	for child in hand_deck_dock.get_children():
		child.queue_free()
	card_nodes.clear()
	selected_card_control = null

	var count = hand_cards.size()
	if count == 0:
		return

	var center_x = 640.0
	var spacing = clamp(680.0 / float(max(count, 1)), 38.0, 92.0)
	var total_w = float(count - 1) * spacing
	var start_x = center_x - (total_w / 2.0)

	for i in range(count):
		var card = CARD_SCENE.instantiate()
		hand_deck_dock.add_child(card)
		card.set_card(hand_cards[i])
		card.card_clicked.connect(_on_card_clicked)
		card.card_hovered.connect(_on_card_hovered)
		card.card_unhovered.connect(_on_card_unhovered)
		card_nodes.append(card)

		# Fan curve: arched rotation and gentle height curve
		var offset_norm = (float(i) - (float(count - 1) / 2.0))
		var rot_deg = offset_norm * 2.6
		var rot_rad = deg_to_rad(rot_deg)
		var y_arch = abs(offset_norm) * 3.2

		var target_pos = Vector2(start_x + (float(i) * spacing) - 46.0, y_arch)
		card.set_fan_transform(target_pos, rot_rad)

func _on_card_clicked(card_control):
	if selected_card_control == card_control:
		card_control.set_selected(false)
		selected_card_control = null
		_cancel_selection_mode()
		return

	if selected_card_control != null:
		selected_card_control.set_selected(false)

	selected_card_control = card_control
	card_control.set_selected(true)

	var c_data = card_control.card_data
	_display_card_in_inspector(c_data)
	var c_type = str(c_data.get("type", "number"))
	var c_val = c_data.get("value", null)

	var is_my_turn = bool(current_room_state.get("isMyTurn", false))
	if not is_my_turn:
		_show_toast_simple("ليس دورك الآن!")
		return

	if c_type == "number":
		pending_action_type = "ask_number"
		pending_number = int(c_val)
		var num_name = str(c_val)
		if c_val == 11: num_name = "كا"
		elif c_val == 12: num_name = "تش"
		_enable_target_selection("اختر اللاعب الذي تريد طلب [" + num_name + "] منه")

	elif c_type in ["badl_edain", "sayad", "bos_bosa", "msh_shaifak", "kefaya_3leik"]:
		pending_action_type = "play_action"
		pending_action_card_id = str(c_data.get("id", ""))
		_enable_target_selection("اختر اللاعب المستهدف بكارت " + c_type)

	elif c_type in ["magnatees", "special"]:
		pending_action_type = "play_action_pick_num"
		pending_action_card_id = str(c_data.get("id", ""))
		if c_type == "magnatees":
			_show_number_picker("🧲 اختر الرقم الذي تريد سحبه بالمغناطيس من الجميع:", true)
		else:
			_show_number_picker("💎 سبيشيال: اختر الرقم المطلوب من الخصم:", false)

	elif c_type in ["el3ab_tani", "mana3a", "lef_w_erga3"]:
		NetworkManager.play_action_card(str(c_data.get("id", "")))
		selected_card_control.set_selected(false)
		selected_card_control = null

func _enable_target_selection(instruction: String):
	target_instruction_lbl.text = instruction
	target_instruction_panel.visible = true
	var my_idx = int(current_room_state.get("myPlayerIndex", 0))
	for i in range(seat_nodes.size()):
		if i != my_idx:
			seat_nodes[i].set_target_mode(true)

func _cancel_selection_mode():
	target_instruction_panel.visible = false
	number_picker_modal.visible = false
	throw_wheel_modal.visible = false
	pending_action_type = ""
	pending_action_card_id = ""
	pending_number = -1
	pending_throw_target = -1
	for seat in seat_nodes:
		seat.set_target_mode(false)
	if selected_card_control != null:
		selected_card_control.set_selected(false)
		selected_card_control = null

func _on_target_seat_selected(target_idx: int):
	if pending_action_type == "ask_number":
		NetworkManager.ask_number(target_idx, pending_number)
	elif pending_action_type == "play_action":
		NetworkManager.play_action_card(pending_action_card_id, target_idx)
	elif pending_action_type == "play_action_pick_num":
		NetworkManager.play_action_card(pending_action_card_id, target_idx, pending_number)
	_cancel_selection_mode()

func _on_seat_throw_clicked(target_idx: int):
	pending_throw_target = target_idx
	var players = current_room_state.get("players", [])
	var tname = "اللاعب"
	if target_idx < players.size():
		tname = str(players[target_idx].get("name", "اللاعب"))
	throw_target_lbl.text = "🎯 ارمي هدية أو مقلب على: " + tname
	throw_wheel_modal.visible = true

func _on_number_picked(value: int):
	number_picker_modal.visible = false
	pending_number = value
	if pending_action_type == "play_action_pick_num":
		var c_data = selected_card_control.card_data if selected_card_control else {}
		if str(c_data.get("type", "")) == "magnatees":
			NetworkManager.play_action_card(pending_action_card_id, -1, value)
			_cancel_selection_mode()
		else:
			_enable_target_selection("اختر اللاعب لطلب رقم " + str(value) + " منه")

func _on_timer_tick(remaining: int):
	var cur_idx = int(current_room_state.get("currentIdx", 0))
	if cur_idx >= 0 and cur_idx < seat_nodes.size():
		seat_nodes[cur_idx].set_timer(remaining)

func _show_liar_prompt(data: Dictionary):
	var asker_name = str(data.get("askerName", "لاعب"))
	var num = data.get("requestedNumber", 0)
	var count = data.get("count", 1)
	var num_str = str(num)
	if num == 11: num_str = "كا"
	elif num == 12: num_str = "تش"

	liar_msg_lbl.text = asker_name + " بيطلب منك [" + num_str + "] ومعاك " + str(count) + " كروت!\nمعاك كارت الكداب... هتعمل إيه؟"
	liar_modal.visible = true

func _on_liar_choice(lie: bool):
	liar_modal.visible = false
	NetworkManager.liar_decision(lie)

func _show_action_toast(data: Dictionary):
	var title = str(data.get("title", "أكشن!"))
	var desc = str(data.get("desc", ""))
	toast_title.text = title
	toast_desc.text = desc
	action_toast.visible = true
	action_toast.modulate.a = 0.0

	# Active feed into the center screen!
	if live_feed_line1:
		live_feed_line1.text = "⚡ " + title + " | " + desc
		var tw = create_tween()
		tw.tween_property(live_feed_line1, "modulate", Color(1.6, 1.4, 0.5), 0.15)
		tw.tween_property(live_feed_line1, "modulate", Color(1.0, 1.0, 1.0), 0.35)

	var tween = create_tween()
	tween.tween_property(action_toast, "modulate:a", 1.0, 0.2)
	tween.tween_interval(2.6)
	tween.tween_property(action_toast, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): action_toast.visible = false)

func _show_toast_simple(msg: String):
	toast_title.text = "تنبيه"
	toast_desc.text = msg
	action_toast.visible = true
	action_toast.modulate.a = 1.0
	var tween = create_tween()
	tween.tween_interval(2.0)
	tween.tween_property(action_toast, "modulate:a", 0.0, 0.3)
	tween.tween_callback(func(): action_toast.visible = false)

# Flying Throwable Item Animation across the table
func _on_item_thrown(data: Dictionary):
	var from_idx = int(data.get("fromIdx", 0))
	var target_idx = int(data.get("targetIdx", 0))
	var item_type = str(data.get("itemType", "tea"))

	var pos_start = Vector2(640, 500)
	var pos_end = Vector2(640, 200)

	if from_idx < seat_nodes.size():
		pos_start = seat_nodes[from_idx].position + Vector2(85, 45)
	if target_idx < seat_nodes.size():
		pos_end = seat_nodes[target_idx].position + Vector2(85, 45)

	var icon = "🩴"
	match item_type:
		"tea": icon = "☕"
		"tomato": icon = "🍅"
		"bomb": icon = "💣"
		"rocket": icon = "🚀"
		"heart": icon = "❤️"

	flying_projectile.text = icon
	flying_projectile.position = pos_start
	flying_projectile.visible = true
	flying_projectile.rotation = 0.0
	flying_projectile.scale = Vector2(1.5, 1.5)

	var tween = create_tween().set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(flying_projectile, "position", pos_end, 0.7)
	tween.parallel().tween_property(flying_projectile, "rotation", TAU * 2.0, 0.7)
	tween.tween_callback(func():
		flying_projectile.visible = false
		if target_idx < seat_nodes.size():
			seat_nodes[target_idx].play_hit_reaction(item_type)
	)

func _on_chat_bubble(data: Dictionary):
	var p_idx = int(data.get("pIdx", 0))
	var text = str(data.get("text", ""))
	var emoji = str(data.get("emoji", "💬"))
	if p_idx < seat_nodes.size():
		seat_nodes[p_idx].show_speech(text, emoji)

# Hand Swap Animation
func _play_hand_swap_animation(data: Dictionary):
	var p1_idx = int(data.get("p1Idx", 0))
	var p2_idx = int(data.get("p2Idx", 1))
	var p1_name = str(data.get("p1Name", "لاعب 1"))
	var p2_name = str(data.get("p2Name", "لاعب 2"))

	swap_lbl.text = "🤝 تبديل الكروت بين " + p1_name + " و " + p2_name + "!"
	swap_overlay.visible = true

	var pos1 = Vector2(200, 300)
	var pos2 = Vector2(1080, 300)
	if p1_idx < seat_nodes.size(): pos1 = seat_nodes[p1_idx].position + Vector2(85, 45)
	if p2_idx < seat_nodes.size(): pos2 = seat_nodes[p2_idx].position + Vector2(85, 45)

	swap_card1.position = pos1 - Vector2(40, 55)
	swap_card2.position = pos2 - Vector2(40, 55)

	var tween = create_tween()
	tween.parallel().tween_property(swap_card1, "position", pos2 - Vector2(40, 55), 1.0).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(swap_card2, "position", pos1 - Vector2(40, 55), 1.0).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	tween.parallel().tween_property(swap_card1, "rotation", TAU, 1.0)
	tween.parallel().tween_property(swap_card2, "rotation", -TAU, 1.0)
	tween.tween_interval(0.4)
	tween.tween_callback(func(): swap_overlay.visible = false)

# --- Card Inspector Implementation (db0 Card Game Framework Style) ---
func _setup_card_inspector():
	card_inspector_panel = PanelContainer.new()
	card_inspector_panel.name = "CardInspector"
	card_inspector_panel.custom_minimum_size = Vector2(510, 142)
	card_inspector_panel.size = Vector2(510, 142)
	card_inspector_panel.position = Vector2(385, 12)
	card_inspector_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.10, 0.03, 0.05, 0.94)
	sb.border_color = Color(0.85, 0.68, 0.25, 0.9)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(14)
	sb.shadow_color = Color(0, 0, 0, 0.75)
	sb.shadow_size = 14
	card_inspector_panel.add_theme_stylebox_override("panel", sb)

	var margin = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 14)
	margin.add_theme_constant_override("margin_right", 14)
	margin.add_theme_constant_override("margin_top", 10)
	margin.add_theme_constant_override("margin_bottom", 10)
	card_inspector_panel.add_child(margin)

	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	margin.add_child(hbox)

	# Left: Card preview thumbnail
	inspector_card_img = TextureRect.new()
	inspector_card_img.custom_minimum_size = Vector2(80, 120)
	inspector_card_img.size = Vector2(80, 120)
	inspector_card_img.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	inspector_card_img.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	inspector_card_img.texture = TextureHelper.get_tex("res://cards/card_back.png")
	hbox.add_child(inspector_card_img)

	# Right: Info details
	var vbox = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 4)
	margin.add_child(vbox)

	# Header row
	var header = HBoxContainer.new()
	header.add_theme_constant_override("separation", 10)
	vbox.add_child(header)

	inspector_title = Label.new()
	inspector_title.text = "كاتش VIP - لاونج"
	inspector_title.add_theme_color_override("font_color", Color(1.0, 0.88, 0.35, 1.0))
	inspector_title.add_theme_font_size_override("font_size", 16)
	header.add_child(inspector_title)

	inspector_cat_panel = PanelContainer.new()
	var cat_sb = StyleBoxFlat.new()
	cat_sb.bg_color = Color(0.65, 0.12, 0.18, 0.9)
	cat_sb.set_corner_radius_all(6)
	inspector_cat_panel.add_theme_stylebox_override("panel", cat_sb)
	var cat_margin = MarginContainer.new()
	cat_margin.add_theme_constant_override("margin_left", 8)
	cat_margin.add_theme_constant_override("margin_right", 8)
	cat_margin.add_theme_constant_override("margin_top", 2)
	cat_margin.add_theme_constant_override("margin_bottom", 2)
	inspector_cat_panel.add_child(cat_margin)
	inspector_cat_lbl = Label.new()
	inspector_cat_lbl.text = "نظام الفحص"
	inspector_cat_lbl.add_theme_font_size_override("font_size", 11)
	inspector_cat_lbl.add_theme_color_override("font_color", Color.WHITE)
	cat_margin.add_child(inspector_cat_lbl)
	header.add_child(inspector_cat_panel)

	# Desc label
	inspector_desc = Label.new()
	inspector_desc.text = "مرر الماوس على أي كارت في إيدك لعرض تفاصيله وقواعده بالكامل (مثل إطار Db0 الأسطوري)."
	inspector_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	inspector_desc.add_theme_font_size_override("font_size", 12)
	inspector_desc.add_theme_color_override("font_color", Color(0.92, 0.92, 0.95, 0.95))
	vbox.add_child(inspector_desc)

	# Tip label
	inspector_tip = Label.new()
	inspector_tip.text = "💡 نصيحة: اختر كروتك بعناية واطلب الأرقام في دورك لتكوين اللِمّات!"
	inspector_tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	inspector_tip.add_theme_font_size_override("font_size", 11)
	inspector_tip.add_theme_color_override("font_color", Color(0.4, 0.9, 1.0, 0.95))
	vbox.add_child(inspector_tip)

	game_panel.add_child(card_inspector_panel)

func _on_card_hovered(card_control):
	if card_control == null:
		return
	_display_card_in_inspector(card_control.card_data)

func _on_card_unhovered(card_control):
	if selected_card_control != null:
		_display_card_in_inspector(selected_card_control.card_data)

func _display_card_in_inspector(c_data: Dictionary):
	if card_inspector_panel == null or c_data.is_empty():
		return

	var c_type = str(c_data.get("type", "number"))
	var c_val = c_data.get("value", null)

	var tex_path = ""
	var key = c_type
	if c_type == "number":
		if c_val == 11:
			tex_path = "res://cards/card_CA.png"
			key = "card_CA"
		elif c_val == 12:
			tex_path = "res://cards/card_TCH.png"
			key = "card_TCH"
		else:
			tex_path = "res://cards/number_%s.png" % str(c_val)
			key = "number"
	else:
		tex_path = "res://cards/%s.png" % c_type

	var tex = TextureHelper.get_tex(tex_path)
	if tex:
		inspector_card_img.texture = tex

	if CARD_INSPECTOR_INFO.has(key):
		var info = CARD_INSPECTOR_INFO[key]
		if key == "number":
			inspector_title.text = "رقم " + str(c_val)
		else:
			inspector_title.text = str(info.get("title", ""))
		inspector_cat_lbl.text = str(info.get("category", ""))
		inspector_desc.text = str(info.get("desc", ""))
		inspector_tip.text = str(info.get("tip", ""))

# --- Dedicated Live Interaction Feed HUD (شاشة التفاعلات المباشرة) ---
func _setup_live_action_feed():
	live_feed_panel = PanelContainer.new()
	live_feed_panel.name = "LiveActionFeed"
	live_feed_panel.custom_minimum_size = Vector2(490, 84)
	live_feed_panel.size = Vector2(490, 84)
	live_feed_panel.position = Vector2(395, 385)
	live_feed_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.02, 0.04, 0.92)
	sb.border_color = Color(0.85, 0.68, 0.25, 0.85)
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(12)
	sb.shadow_color = Color(0, 0, 0, 0.8)
	sb.shadow_size = 12
	live_feed_panel.add_theme_stylebox_override("panel", sb)

	var margin = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 12)
	margin.add_theme_constant_override("margin_right", 12)
	margin.add_theme_constant_override("margin_top", 6)
	margin.add_theme_constant_override("margin_bottom", 6)
	live_feed_panel.add_child(margin)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 3)
	margin.add_child(vbox)

	# Title Header
	var title_lbl = Label.new()
	title_lbl.text = "⚡ شاشة التفاعلات والأحداث الحية"
	title_lbl.add_theme_font_size_override("font_size", 11)
	title_lbl.add_theme_color_override("font_color", Color(1.0, 0.82, 0.35))
	vbox.add_child(title_lbl)

	# Latest Action (High contrast, bold, font 14)
	live_feed_line1 = Label.new()
	live_feed_line1.text = "مرحباً بكم في لاونج كاتش VIP! بدأت الجولة."
	live_feed_line1.add_theme_font_size_override("font_size", 14)
	live_feed_line1.add_theme_color_override("font_color", Color(1.0, 0.95, 0.6))
	live_feed_line1.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	live_feed_line1.clip_text = true
	vbox.add_child(live_feed_line1)

	# Previous Action (Font 11, dimmed silver)
	live_feed_line2 = Label.new()
	live_feed_line2.text = ""
	live_feed_line2.add_theme_font_size_override("font_size", 11)
	live_feed_line2.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9, 0.7))
	live_feed_line2.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	live_feed_line2.clip_text = true
	vbox.add_child(live_feed_line2)

	game_panel.add_child(live_feed_panel)

func _update_live_action_feed(logs: Array):
	if live_feed_panel == null:
		return
	var count = logs.size()
	if count > 0:
		var last_log = str(logs[count - 1])
		live_feed_line1.text = "🔥 " + last_log
		# Quick pulse tween for new action
		var tw = create_tween()
		tw.tween_property(live_feed_line1, "modulate", Color(1.3, 1.3, 1.0), 0.1)
		tw.tween_property(live_feed_line1, "modulate", Color(1.0, 1.0, 1.0), 0.2)

		if count > 1:
			live_feed_line2.text = "⏳ " + str(logs[count - 2])
		else:
			live_feed_line2.text = ""


