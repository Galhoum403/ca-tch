extends Control

signal target_selected(player_index)
signal throw_item_clicked(player_index)

var player_index: int = -1
var player_id: String = ""
var is_active_turn: bool = false
var is_self_player: bool = false

@onready var avatar_frame: Panel = $AvatarFrame
@onready var avatar_tex: TextureRect = $AvatarFrame/AvatarTex
@onready var glow_aura: Panel = $AvatarFrame/GlowAura
@onready var host_crown: Label = $AvatarFrame/HostCrown
@onready var timer_ring: ProgressBar = $AvatarFrame/TimerRing
@onready var hit_splat: Label = $AvatarFrame/HitSplat

@onready var name_lbl: Label = $NameBadge/NameLbl
@onready var sets_lbl: Label = $StatsBox/SetsBadge/Label
@onready var cards_lbl: Label = $StatsBox/CardsBadge/Label

@onready var opponent_cards_fan: Control = $OpponentCardsFan
@onready var speech_bubble: PanelContainer = $SpeechBubble
@onready var speech_lbl: Label = $SpeechBubble/Margin/SpeechLbl

@onready var target_btn: Button = $TargetBtn
@onready var throw_btn: Button = $ThrowBtn

func _ready():
	target_btn.pressed.connect(_on_target_pressed)
	throw_btn.pressed.connect(_on_throw_pressed)
	target_btn.visible = false
	throw_btn.visible = false
	speech_bubble.visible = false
	hit_splat.visible = false
	glow_aura.visible = false

func update_seat(player_data: Dictionary, p_idx: int, current_turn_idx: int, is_self: bool):
	player_index = p_idx
	player_id = str(player_data.get("id", ""))
	is_self_player = is_self

	var p_name = str(player_data.get("name", "لاعب"))
	var is_host = bool(player_data.get("isHost", false))
	var card_count = int(player_data.get("cardCount", 0))
	var score = int(player_data.get("score", 0))

	# Assign authentic silhouette avatar matching Image 1
	var avatar_path = "res://avatars/avatar_player.png"
	if is_self:
		avatar_path = "res://avatars/avatar_player.png"
	elif p_idx == 1:
		avatar_path = "res://avatars/avatar_opponent1.png"
	elif p_idx == 2:
		avatar_path = "res://avatars/avatar_opponent2.png"
	elif p_idx == 3:
		avatar_path = "res://avatars/avatar_opponent3.png"
	else:
		avatar_path = "res://avatars/avatar_opponent1.png"

	avatar_tex.texture = TextureHelper.get_tex(avatar_path)

	name_lbl.text = p_name + (" (أنت)" if is_self else "")
	host_crown.visible = is_host
	sets_lbl.text = "🏅 " + str(score)
	cards_lbl.text = "🎴 " + str(card_count)

	is_active_turn = (p_idx == current_turn_idx)
	glow_aura.visible = is_active_turn
	timer_ring.visible = is_active_turn

	# Show throw gift button on opponents
	throw_btn.visible = not is_self

	# Display opponent fanned card backs along the table border
	_update_opponent_mini_fan(card_count, is_self)

func _update_opponent_mini_fan(card_count: int, is_self: bool):
	for c in opponent_cards_fan.get_children():
		c.queue_free()

	if is_self or card_count <= 0:
		opponent_cards_fan.visible = false
		return

	opponent_cards_fan.visible = true
	var display_count = mini(card_count, 6)
	var card_w = 32.0
	var card_h = 46.0
	var spacing = 16.0

	var back_tex = TextureHelper.get_tex("res://cards/card_back.png")
	for i in range(display_count):
		var tr = TextureRect.new()
		tr.custom_minimum_size = Vector2(card_w, card_h)
		tr.size = Vector2(card_w, card_h)
		tr.texture = back_tex
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		tr.position = Vector2(float(i) * spacing, float(abs(i - 2)) * 3.0)
		tr.rotation = deg_to_rad(float(i - 2) * 5.0)
		opponent_cards_fan.add_child(tr)

func set_timer(remaining: int, total: int = 90):
	if is_active_turn:
		timer_ring.max_value = total
		timer_ring.value = remaining

func set_target_mode(active: bool):
	target_btn.visible = active

func show_speech(text: String, emoji: String = "💬"):
	speech_lbl.text = emoji + " " + text
	speech_bubble.visible = true
	speech_bubble.scale = Vector2.ZERO
	speech_bubble.modulate.a = 1.0

	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(speech_bubble, "scale", Vector2(1.0, 1.0), 0.25)
	tween.tween_interval(3.2)
	tween.tween_property(speech_bubble, "modulate:a", 0.0, 0.4)
	tween.tween_callback(func(): speech_bubble.visible = false)

func play_hit_reaction(item_type: String):
	var splat_text = "💥"
	match item_type:
		"slipper": splat_text = "🩴 طرااااخ!"
		"tea": splat_text = "☕ شاي سخن!"
		"tomato": splat_text = "🍅 طـششش!"
		"bomb": splat_text = "💣 بـوووووم!"
		"rocket": splat_text = "🚀 فـشششش!"
		"heart": splat_text = "❤️ بحبك يا برنس!"

	hit_splat.text = splat_text
	hit_splat.visible = true
	hit_splat.scale = Vector2.ZERO

	# Shake avatar
	var orig_x = avatar_frame.position.x
	var shake_tween = create_tween()
	for k in range(4):
		shake_tween.tween_property(avatar_frame, "position:x", orig_x + (8.0 if k % 2 == 0 else -8.0), 0.05)
	shake_tween.tween_property(avatar_frame, "position:x", orig_x, 0.05)

	var splat_tween = create_tween().set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	splat_tween.tween_property(hit_splat, "scale", Vector2(1.3, 1.3), 0.2)
	splat_tween.tween_interval(1.5)
	splat_tween.tween_property(hit_splat, "modulate:a", 0.0, 0.3)
	splat_tween.tween_callback(func():
		hit_splat.visible = false
		hit_splat.modulate.a = 1.0
	)

func _on_target_pressed():
	emit_signal("target_selected", player_index)

func _on_throw_pressed():
	emit_signal("throw_item_clicked", player_index)
