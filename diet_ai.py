import random
from typing import List, Dict, Tuple

def calculate_bmr(weight, height, age, sex):
    if sex.lower() == "male":
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:
        return 10 * weight + 6.25 * height - 5 * age - 161

def calculate_tdee(data):
    activity_map = {
        "sedentary": 1.2,
        "lightly active": 1.375,
        "moderately active": 1.55,
        "very active": 1.725,
        "athlete": 1.9
    }

    # Normalize common, more descriptive labels from the UI
    ui_activity_alias = {
        # Earlier verbose labels
        "sedentary (little/no exercise)": "sedentary",
        "light (1-3 days/week)": "lightly active",
        "moderate (3-5 days/week)": "moderately active",
        "active (6-7 days/week)": "very active",
        "athlete (twice daily)": "athlete",
        # Simple labels now used in UI
        "mostly sitting": "sedentary",
        "some movement": "lightly active",
        "regular exercise": "moderately active",
        "very active": "very active",
        "athlete": "athlete",
    }

    bmr = calculate_bmr(data["weight"], data["height"], data["age"], data["sex"])
    activity_raw = str(data.get("activity", "Moderately Active"))
    activity_key = ui_activity_alias.get(activity_raw.lower(), activity_raw.lower())
    tdee = bmr * activity_map.get(activity_key, 1.55)

    goal = data.get("goal", "Maintain")
    if goal == "Lose Fat":
        tdee *= 0.8
    elif goal == "Gain Muscle":
        tdee *= 1.15
    elif goal == "Gain Weight":
        # Modest surplus targeted for overall weight gain
        tdee *= 1.10

    return tdee

def macro_targets(tdee, data):
    weight = data["weight"]
    goal = data["goal"]

    if goal == "Lose Fat":
        protein_g = 1.6 * weight
    else:
        protein_g = 1.4 * weight

    protein_cal = protein_g * 4
    remaining = tdee - protein_cal
    carbs = remaining * 0.5 / 4
    fats = remaining * 0.25 / 9

    return {
        "protein_g": round(protein_g, 1),
        "carbs_g": round(carbs, 1),
        "fats_g": round(fats, 1)
    }

foods = [
    # Breakfast staples
    {"name": "Oats (1 cup cooked)", "protein": 6, "carbs": 27, "fat": 3, "cal": 154, "type": "veg"},
    {"name": "Greek Yogurt (200g)", "protein": 20, "carbs": 8, "fat": 4, "cal": 146, "type": "veg"},
    {"name": "Banana", "protein": 1, "carbs": 27, "fat": 0, "cal": 105, "type": "vegan"},
    {"name": "Apple", "protein": 0, "carbs": 25, "fat": 0, "cal": 95, "type": "vegan"},
    {"name": "Whole Wheat Bread (2 slices)", "protein": 8, "carbs": 24, "fat": 2, "cal": 140, "type": "vegan"},
    {"name": "Peanut Butter (2 tbsp)", "protein": 8, "carbs": 6, "fat": 16, "cal": 188, "type": "vegan"},
    {"name": "Scrambled Eggs (2)", "protein": 12, "carbs": 2, "fat": 14, "cal": 182, "type": "veg"},
    # Plant proteins
    {"name": "Tofu (150g)", "protein": 17, "carbs": 3, "fat": 9, "cal": 144, "type": "vegan"},
    {"name": "Paneer (100g)", "protein": 18, "carbs": 6, "fat": 20, "cal": 265, "type": "veg"},
    {"name": "Chickpeas (1 cup cooked)", "protein": 15, "carbs": 45, "fat": 4, "cal": 269, "type": "vegan"},
    {"name": "Lentils (1 cup cooked)", "protein": 18, "carbs": 40, "fat": 1, "cal": 230, "type": "vegan"},
    # Grains & staples
    {"name": "Rice (1 cup cooked)", "protein": 4, "carbs": 45, "fat": 1, "cal": 206, "type": "vegan"},
    {"name": "Quinoa (1 cup cooked)", "protein": 8, "carbs": 39, "fat": 4, "cal": 222, "type": "vegan"},
    {"name": "Roti/Chapati (2)", "protein": 6, "carbs": 34, "fat": 4, "cal": 200, "type": "vegan"},
    # Non-veg proteins
    {"name": "Chicken Breast (150g)", "protein": 40, "carbs": 0, "fat": 5, "cal": 220, "type": "non-veg"},
    {"name": "Fish (Salmon 120g)", "protein": 23, "carbs": 0, "fat": 10, "cal": 208, "type": "non-veg"},
    {"name": "Eggs (2)", "protein": 13, "carbs": 1, "fat": 11, "cal": 155, "type": "veg"},
    # Sides & veggies
    {"name": "Mixed Salad (2 cups)", "protein": 2, "carbs": 10, "fat": 5, "cal": 90, "type": "vegan"},
    {"name": "Sauteed Vegetables (1 cup)", "protein": 3, "carbs": 12, "fat": 5, "cal": 100, "type": "vegan"},
    {"name": "Cucumber Raita (1/2 cup)", "protein": 3, "carbs": 5, "fat": 4, "cal": 60, "type": "veg"},
    # Snacks
    {"name": "Almonds (30g)", "protein": 6, "carbs": 6, "fat": 14, "cal": 164, "type": "vegan"},
    {"name": "Protein Shake (1 scoop)", "protein": 24, "carbs": 3, "fat": 2, "cal": 120, "type": "veg"},
    {"name": "Dark Chocolate (30g)", "protein": 2, "carbs": 13, "fat": 10, "cal": 170, "type": "veg"},
    # More staples and Indian cuisine
    {"name": "Dal (1 cup)", "protein": 12, "carbs": 30, "fat": 5, "cal": 230, "type": "vegan"},
    {"name": "Rajma (1 cup)", "protein": 15, "carbs": 40, "fat": 2, "cal": 240, "type": "vegan"},
    {"name": "Chole (1 cup)", "protein": 14, "carbs": 35, "fat": 8, "cal": 280, "type": "vegan"},
    {"name": "Idli (3)", "protein": 8, "carbs": 54, "fat": 2, "cal": 270, "type": "vegan"},
    {"name": "Dosa (1)", "protein": 5, "carbs": 35, "fat": 8, "cal": 240, "type": "vegan"},
    {"name": "Upma (1 cup)", "protein": 7, "carbs": 40, "fat": 9, "cal": 280, "type": "veg"},
    {"name": "Poha (1 cup)", "protein": 4, "carbs": 30, "fat": 7, "cal": 210, "type": "vegan"},
    {"name": "Sweet Potato (200g)", "protein": 4, "carbs": 41, "fat": 0, "cal": 180, "type": "vegan"},
    {"name": "Cottage Cheese Sandwich", "protein": 20, "carbs": 35, "fat": 12, "cal": 340, "type": "veg"},
    {"name": "Grilled Fish (150g)", "protein": 32, "carbs": 0, "fat": 8, "cal": 230, "type": "non-veg"},
    {"name": "Chicken Curry (1 cup)", "protein": 28, "carbs": 6, "fat": 14, "cal": 280, "type": "non-veg"},
    {"name": "Tofu Stir-fry (1 cup)", "protein": 18, "carbs": 15, "fat": 10, "cal": 230, "type": "vegan"},
    {"name": "Mixed Fruit Bowl", "protein": 2, "carbs": 30, "fat": 1, "cal": 130, "type": "vegan"},
]

def _filter_foods_by_pref(pref: str) -> List[Dict]:
    pref = (pref or "").strip().lower()
    # Non-vegetarian: allow everything
    if pref in ("non-vegetarian", "non veg", "non-veg", "nonveg"):
        return foods
    # Vegetarian: allow veg + vegan
    if pref == "vegetarian":
        return [f for f in foods if f["type"] in ("veg", "vegan")]
    # Vegan: allow only vegan
    if pref == "vegan":
        return [f for f in foods if f["type"] == "vegan"]
    # Default fallback: allow all
    return foods


def _ga_optimize_meal(allowed: List[Dict], target_cal: float, items_min: int, items_max: int,
                      used_names: set, population_size: int = 30, generations: int = 35,
                      top_k_elite: int = 6, mutation_rate: float = 0.25) -> Tuple[List[Dict], int]:
    if not allowed:
        return [], 0

    def random_individual() -> List[Dict]:
        k = random.randint(items_min, items_max)
        # Prefer not-yet-used items initially
        pool = [f for f in allowed if f["name"] not in used_names] or allowed
        return random.sample(pool, min(k, len(pool)))

    def fitness(ind: List[Dict]) -> float:
        total = sum(f["cal"] for f in ind)
        # calorie deviation (lower is better)
        dev = abs(total - target_cal)
        # repetition penalty if repeats inside individual
        names = [f["name"] for f in ind]
        repeat_penalty = (len(names) - len(set(names))) * 200
        # encourage diversity vs. already used names
        overlap_penalty = sum(1 for n in names if n in used_names) * 80
        # smaller penalty for size extremes
        size_penalty = 40 * max(0, items_min - len(ind)) + 20 * max(0, len(ind) - items_max)
        return dev + repeat_penalty + overlap_penalty + size_penalty

    def crossover(a: List[Dict], b: List[Dict]) -> List[Dict]:
        # take unique union then sample a size between min/max
        merged = {f["name"]: f for f in a + b}
        k = random.randint(items_min, items_max)
        values = list(merged.values())
        random.shuffle(values)
        return values[:min(k, len(values))]

    def mutate(ind: List[Dict]) -> List[Dict]:
        if random.random() > mutation_rate or not allowed:
            return ind
        ind = ind[:]
        if ind and random.random() < 0.5:
            # replace one item
            replace_idx = random.randrange(len(ind))
            pool = [f for f in allowed if f["name"] not in {it["name"] for it in ind}]
            if pool:
                ind[replace_idx] = random.choice(pool)
        else:
            # resize within bounds
            k = random.randint(items_min, items_max)
            pool = [f for f in allowed if f["name"] not in {it["name"] for it in ind}]
            while len(ind) < k and pool:
                pick = random.choice(pool)
                pool.remove(pick)
                ind.append(pick)
            if len(ind) > k:
                random.shuffle(ind)
                ind = ind[:k]
        return ind

    # Initialize population
    pop = [random_individual() for _ in range(population_size)]
    for _ in range(generations):
        pop.sort(key=fitness)
        next_gen = pop[:top_k_elite]
        while len(next_gen) < population_size:
            p1, p2 = random.sample(pop[:max(top_k_elite * 2, 10)], 2)
            child = crossover(p1, p2)
            child = mutate(child)
            next_gen.append(child)
        pop = next_gen

    pop.sort(key=fitness)
    best = pop[0]
    return best, int(round(sum(f["cal"] for f in best)))


def generate_diet_plan(data, tdee):
    """Generate a full-day plan (Breakfast, Lunch, Snack, Dinner) using GA to create
    multiple options per meal that approximate per-meal calorie targets.
    """
    allowed = _filter_foods_by_pref(data.get("diet", ""))

    # Calorie distribution across the day
    splits = {
        "Breakfast": 0.25,
        "Lunch": 0.35,
        "Snack": 0.10,
        "Dinner": 0.30
    }

    # Items-per-meal bounds
    bounds = {
        "Breakfast": (2, 3),
        "Lunch": (2, 4),
        "Snack": (1, 2),
        "Dinner": (2, 4)
    }

    plan = []
    total_cal = 0
    used_names = set()

    for meal, frac in splits.items():
        target = tdee * frac
        items_min, items_max = bounds.get(meal, (2, 3))

        # Produce multiple options via GA and keep the top few unique ones
        options = []
        seen_signatures = set()
        for _ in range(7):  # run GA multiple times for diversity
            best_items, best_cal = _ga_optimize_meal(
                allowed=allowed,
                target_cal=target,
                items_min=items_min,
                items_max=items_max,
                used_names=used_names,
                population_size=28,
                generations=28,
                top_k_elite=6,
                mutation_rate=0.30
            )
            signature = tuple(sorted(f["name"] for f in best_items))
            if signature and signature not in seen_signatures:
                seen_signatures.add(signature)
                options.append({
                    "items": [f["name"] for f in best_items],
                    "calories": best_cal
                })
            if len(options) >= 3:
                break

        # Fallback if options empty
        if not options:
            options = [{"items": [allowed[0]["name"]], "calories": allowed[0]["cal"]}]

        # Choose the first option as default, and mark items as used to promote diversity across day
        chosen = options[0]
        for name in chosen["items"]:
            used_names.add(name)

        total_cal += chosen["calories"]
        plan.append({
            "meal": meal,
            "items": chosen["items"],
            "calories": chosen["calories"],
            "options": options
        })

    return {"total_calories": int(round(total_cal)), "meals": plan}
