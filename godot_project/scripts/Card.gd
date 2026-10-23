extends Control

signal card_clicked(card_control)
signal card_hovered(card_control)
signal card_unhovered(card_control)

var card_data: Dictionary = {}
var is_selected: bool = false
var base_pos: Vector2 = Vector2.ZERO
var base_rot: float = 0.0

@onready var texture_rect: TextureRect = $TextureRect
@onready var border: ReferenceRect = $Border
@onready var glow: Panel = $Glow
@onready var label: Label = $Label

func _ready():
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)
	gui_input.connect(_on_gui_input)
	border.visible = false
	glow.visible = false

func set_card(data: Dictionary):
	card_data = data
	var c_type = str(data.get("type", "number"))
	var c_val = data.get("value", null)
	var c_lbl = str(data.get("label", ""))

	var tex_path = ""
	if c_type == "number":
		if c_val == 11:
			tex_path = "res://cards/card_CA.png"
			label.text = ""
		elif c_val == 12:
			tex_path = "res://cards/card_TCH.png"
			label.text = ""
		else:
			tex_path = "res://cards/number_%s.png" % str(c_val)
			label.text = ""
	else:
		tex_path = "res://cards/%s.png" % c_type
		label.text = ""

	var tex = TextureHelper.get_tex(tex_path)
	if tex != null:
		texture_rect.texture = tex
	else:
		label.text = c_lbl if c_lbl != "" else c_type

func set_fan_transform(pos: Vector2, rot: float):
	base_pos = pos
	base_rot = rot
	position = base_pos
	rotation = base_rot

func set_selected(selected: bool):
	is_selected = selected
	border.visible = selected
	glow.visible = selected
	var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if selected:
		tween.parallel().tween_property(self, "position:y", base_pos.y - 48.0, 0.18)
		tween.parallel().tween_property(self, "rotation", 0.0, 0.18)
		tween.parallel().tween_property(self, "scale", Vector2(1.22, 1.22), 0.18)
		z_index = 30
	else:
		tween.parallel().tween_property(self, "position", base_pos, 0.18)
		tween.parallel().tween_property(self, "rotation", base_rot, 0.18)
		tween.parallel().tween_property(self, "scale", Vector2(1.0, 1.0), 0.18)
		z_index = 0

func _on_mouse_entered():
	glow.visible = true
	emit_signal("card_hovered", self)
	if not is_selected:
		var tween = create_tween().set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tween.parallel().tween_property(self, "position:y", base_pos.y - 42.0, 0.14)
		tween.parallel().tween_property(self, "rotation", 0.0, 0.14)
		tween.parallel().tween_property(self, "scale", Vector2(1.18, 1.18), 0.14)
		z_index = 20

func _on_mouse_exited():
	if not is_selected:
		glow.visible = false
		var tween = create_tween().set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tween.parallel().tween_property(self, "position", base_pos, 0.14)
		tween.parallel().tween_property(self, "rotation", base_rot, 0.14)
		tween.parallel().tween_property(self, "scale", Vector2(1.0, 1.0), 0.14)
		z_index = 0
	emit_signal("card_unhovered", self)

func _on_gui_input(event: InputEvent):
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		emit_signal("card_clicked", self)
