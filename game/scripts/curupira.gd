extends CharacterBody2D


const SPEED = 300.0
const JUMP_VELOCITY = -1500.0
const PROJECTILE_SCENE = preload("res://scenes/projectile_base.tscn")


func _physics_process(delta: float) -> void:
	# Add the gravity.
	if not is_on_floor():
		velocity += get_gravity() * delta

	# Handle jump.
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# Get the input direction and handle the movement/deceleration.
	# As good practice, you should replace UI actions with custom gameplay actions.
	var direction := Input.get_axis("move_left", "move_right")
	if direction:
		velocity.x = direction * SPEED
		$AnimatedSprite2D.flip_h = direction < 0
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		
	if Input.is_action_just_pressed("shoot"):
		shoot()

	move_and_slide()

func shoot() -> void:
	var projectile = PROJECTILE_SCENE.instantiate()
	get_parent().add_child(projectile)
	projectile.global_position = global_position
	projectile.direction = -1.0 if $AnimatedSprite2D.flip_h else 1.0
