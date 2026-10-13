extends Area2D

const SPEED = 800.0
var direction := 1.0

func _physics_process(delta: float) -> void:
	position.x += direction * SPEED * delta

func _on_body_entered(body: Node2D) -> void:
	queue_free()  # ou: body.take_damage(...), dependendo do sistema de dano
