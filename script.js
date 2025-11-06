document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ NutriTrack JS loaded");
    
    // Scroll to top on page load/reload
    window.scrollTo(0, 0);
    if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
    }

    const form = document.getElementById("dietForm");
    const output = document.getElementById("output");
    const goalSelect = document.getElementById("goal");
    const autoGoalBtn = document.getElementById("autoGoal");
    const BACKEND_URL = "http://127.0.0.1:5000";
    let lastUser = null;
    let currentPlanData = null; // last rendered API data
    let previousPlanSnapshot = null; // { data, selection, locks }

    // 🎯 Generate My Goal (BMI-based)
    if (autoGoalBtn) {
        autoGoalBtn.addEventListener("click", () => {
            const formData = new FormData(form);
            const user = Object.fromEntries(formData.entries());
            const heightM = parseFloat(user.height || 0) / 100;
            const weight = parseFloat(user.weight || 0);
            if (!heightM || !weight) {
                alert("Please enter height and weight first.");
                return;
            }
            const bmi = weight / (heightM * heightM);
            let goal = "Maintain";
            let category = "";
            if (bmi < 18.5) {
                category = "Underweight";
                goal = "Gain Weight";
            } else if (bmi >= 18.5 && bmi < 25) {
                category = "Healthy";
                if (bmi <= 21.5) goal = "Gain Muscle";
                else goal = "Maintain";
            } else if (bmi >= 25 && bmi < 30) {
                category = "Overweight";
                goal = "Lose Fat";
            } else {
                category = "Obese";
                goal = "Lose Fat";
            }
            goalSelect.value = goal;
            output.innerHTML = `<p><b>BMI:</b> ${bmi.toFixed(1)} - <b>${category}</b></p><p><b>Suggested goal:</b> ${goal}</p>`;
        });
    }

    // Sidebar nav smooth scroll
    const scrollLink = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const home = document.getElementById('navHome');
    const plans = document.getElementById('navPlans');
    const profile = document.getElementById('navProfile');
    if (home) home.addEventListener('click', (e)=>{ e.preventDefault(); scrollLink('top'); });
    if (plans) plans.addEventListener('click', (e)=>{ e.preventDefault(); scrollLink('output'); });
    if (profile) profile.addEventListener('click', (e)=>{ e.preventDefault(); scrollLink('setup'); });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("🚀 Submit button clicked!");
        output.innerHTML = "<p>⏳ Generating your AI diet plan...</p>";

        const formData = new FormData(form);
        const user = Object.fromEntries(formData.entries());
        user.age = parseInt(user.age);
        user.height = parseFloat(user.height);
        user.weight = parseFloat(user.weight);
        lastUser = user;

        console.log("📤 Sending data to backend:", user);

        try {
            const response = await fetch(`${BACKEND_URL}/api/plan`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(user)
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();

            console.log("✅ Response from backend:", data);

            if (data.error) {
                output.innerHTML = `<p style='color:red;'>❌ Error: ${data.error}</p>`;
                return;
            }

            const makeMealHtml = (meal, idx) => {
                const options = meal.options || [{ items: meal.items, calories: meal.calories }];
                return `
                <div class="meal" data-meal-idx="${idx}">
                    <b>${meal.meal}</b>
                    ${options.map((opt, i) => `
                        <div>
                            <label>
                                <input type="radio" name="meal-${idx}" value="${i}" ${i===0?"checked":""}>
                                ${opt.items.join(", ")} <small>(${opt.calories} kcal)</small>
                            </label>
                        </div>
                    `).join("")}
                </div>`;
            };

            // Keep a copy of current data
            currentPlanData = data;

            output.innerHTML = `
                <h3>📊 Personalized AI Daily Plan</h3>
                <p><strong>TDEE:</strong> ${data.tdee} kcal/day</p>
                <p><strong>Macros:</strong> Protein: ${data.macros.protein_g}g |
                    Carbs: ${data.macros.carbs_g}g | Fats: ${data.macros.fats_g}g
                </p>
                <div class="actions" style="margin: 10px 0 6px 0;">
                    <button id="regen" class="primary">🔄 Regenerate Alternatives</button>
                    <button id="undo" style="display:none;">↩️ Undo</button>
                    <button id="savePlan">💾 Save Plan</button>
                    <button id="loadPlan">📂 Load My Plan</button>
                </div>
                <h4>🍽 Meals</h4>
                ${data.plan.meals.map((m, idx) => makeMealHtml(m, idx)).join("")}
                <p style="margin-top:10px"><b>Total Calories:</b> <span id="totalKcal">${data.plan.total_calories}</span> kcal</p>
            `;

            // Recompute total when user selects different options
            const recompute = () => {
                let total = 0;
                data.plan.meals.forEach((meal, idx) => {
                    const selected = document.querySelector(`input[name="meal-${idx}"]:checked`);
                    const selIdx = selected ? parseInt(selected.value) : 0;
                    const opt = (meal.options || [{ calories: meal.calories }])[selIdx] || meal;
                    total += opt.calories;
                });
                const el = document.getElementById("totalKcal");
                if (el) el.textContent = total;
            };
            output.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', recompute));

            // Lock meal checkboxes
            output.querySelectorAll('.meal').forEach((container) => {
                const lock = document.createElement('label');
                lock.innerHTML = ` <input type="checkbox" class="lock-meal"> Lock this meal`;
                container.appendChild(lock);
            });

            // Save/Load plan (localStorage)
            const getSelectedPlan = () => {
                return data.plan.meals.map((meal, idx) => {
                    const selected = document.querySelector(`input[name="meal-${idx}"]:checked`);
                    const selIdx = selected ? parseInt(selected.value) : 0;
                    const opt = (meal.options || [{ items: meal.items, calories: meal.calories }])[selIdx] || meal;
                    return { meal: meal.meal, items: opt.items, calories: opt.calories };
                });
            };
            const getSelectionIndices = () => data.plan.meals.map((_, idx) => {
                const selected = document.querySelector(`input[name="meal-${idx}"]:checked`);
                return selected ? parseInt(selected.value) : 0;
            });
            const buildSignature = (u) => [u.sex, u.age, u.height, u.weight, u.activity, u.goal, u.diet].join('|').toLowerCase();
            const saveBtn = document.getElementById('savePlan');
            const loadBtn = document.getElementById('loadPlan');
            if (saveBtn) saveBtn.onclick = () => {
                const planToSave = { user: lastUser, signature: buildSignature(lastUser), meals: getSelectedPlan(), ts: Date.now() };
                localStorage.setItem('nutritrack:lastPlan', JSON.stringify(planToSave));
                alert('Plan saved locally.');
            };
            if (loadBtn) loadBtn.onclick = () => {
                const raw = localStorage.getItem('nutritrack:lastPlan');
                if (!raw) { alert('No saved plan found.'); return; }
                try {
                    const saved = JSON.parse(raw);
                    // Validate against current inputs
                    const formDataNow = new FormData(form);
                    const userNow = Object.fromEntries(formDataNow.entries());
                    const sigNow = buildSignature(userNow);
                    if (!saved.signature || saved.signature !== sigNow) {
                        alert('Saved plan does not match current inputs. Generate a new plan.');
                        return;
                    }
                    // Render a simple view of saved plan
                    output.innerHTML = `
                        <h3>📂 Loaded Plan</h3>
                        ${saved.meals.map(m => `
                            <div class="meal">
                                <b>${m.meal}</b><br>${m.items.join(', ')} <small>(${m.calories} kcal)</small>
                            </div>
                        `).join('')}
                        <p><b>Total Calories:</b> ${saved.meals.reduce((s,x)=>s+x.calories,0)} kcal</p>
                    `;
                } catch {}
            };

            // Regenerate alternatives (respect locked meals visually)
            const regen = document.getElementById('regen');
            const undoBtn = document.getElementById('undo');
            if (regen) regen.onclick = async () => {
                const locks = Array.from(output.querySelectorAll('.meal')).map((container, idx) => {
                    const isLocked = container.querySelector('.lock-meal')?.checked;
                    const selected = document.querySelector(`input[name="meal-${idx}"]:checked`);
                    const selIdx = selected ? parseInt(selected.value) : 0;
                    return { locked: !!isLocked, selIdx };
                });
                // Snapshot current to allow undo
                previousPlanSnapshot = { data: currentPlanData, selection: getSelectionIndices(), locks };
                if (undoBtn) undoBtn.style.display = 'inline-block';
                // Re-fetch
                try {
                    regen.disabled = true; regen.textContent = 'Generating...';
                    const response = await fetch(`${BACKEND_URL}/api/plan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...lastUser, _t: Date.now() })
                    });
                    if (!response.ok) throw new Error(`Server error: ${response.status}`);
                    const fresh = await response.json();
                    currentPlanData = fresh;
                    // Re-render, preserving locked meals by replacing options with the previously selected option text only
                    output.innerHTML = `
                        <h3>📊 Personalized AI Daily Plan</h3>
                        <p><strong>TDEE:</strong> ${fresh.tdee} kcal/day</p>
                        <p><strong>Macros:</strong> Protein: ${fresh.macros.protein_g}g |
                            Carbs: ${fresh.macros.carbs_g}g | Fats: ${fresh.macros.fats_g}g
                        </p>
                        <div class="actions" style="margin: 10px 0 6px 0;">
                            <button id="regen" class="primary">🔄 Regenerate Alternatives</button>
                            <button id="undo">↩️ Undo</button>
                            <button id="savePlan">💾 Save Plan</button>
                            <button id="loadPlan">📂 Load My Plan</button>
                        </div>
                        <h4>🍽 Meals</h4>
                        ${fresh.plan.meals.map((m, idx) => {
                            if (locks[idx]?.locked) {
                                const prev = data.plan.meals[idx];
                                const prevOptions = prev.options || [{ items: prev.items, calories: prev.calories }];
                                const sel = prevOptions[locks[idx].selIdx] || prevOptions[0];
                                return `
                                <div class="meal" data-meal-idx="${idx}">
                                    <b>${m.meal}</b><br>
                                    ${sel.items.join(', ')} <small>(${sel.calories} kcal)</small>
                                </div>`;
                            }
                            return makeMealHtml(m, idx);
                        }).join('')}
                        <p style="margin-top:10px"><b>Total Calories:</b> <span id="totalKcal">${fresh.plan.total_calories}</span> kcal</p>
                    `;
                    // Reattach listeners
                    output.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', recompute));
                    output.querySelectorAll('.meal').forEach((container, idx) => {
                        if (!locks[idx]?.locked) {
                            const lock = document.createElement('label');
                            lock.innerHTML = ` <input type="checkbox" class="lock-meal"> Lock this meal`;
                            container.appendChild(lock);
                        }
                    });
                    // Re-bind buttons after rerender
                    const saveBtn2 = document.getElementById('savePlan');
                    const loadBtn2 = document.getElementById('loadPlan');
                    const regen2 = document.getElementById('regen');
                    const undo2 = document.getElementById('undo');
                    if (saveBtn2) saveBtn2.onclick = saveBtn.onclick;
                    if (loadBtn2) loadBtn2.onclick = loadBtn.onclick;
                    if (regen2) regen2.onclick = regen.onclick;
                    if (undo2) undo2.onclick = () => {
                        if (!previousPlanSnapshot) return;
                        const prev = previousPlanSnapshot;
                        currentPlanData = prev.data;
                        // Restore previous plan
                        output.innerHTML = `
                            <h3>📊 Personalized AI Daily Plan</h3>
                            <p><strong>TDEE:</strong> ${prev.data.tdee} kcal/day</p>
                            <p><strong>Macros:</strong> Protein: ${prev.data.macros.protein_g}g |
                                Carbs: ${prev.data.macros.carbs_g}g | Fats: ${prev.data.macros.fats_g}g
                            </p>
                            <div class="actions" style="margin: 10px 0 6px 0;">
                                <button id="regen" class="primary">🔄 Regenerate Alternatives</button>
                                <button id="undo" style="display:none;">↩️ Undo</button>
                                <button id="savePlan">💾 Save Plan</button>
                                <button id="loadPlan">📂 Load Last Plan</button>
                            </div>
                            <h4>🍽 Meals</h4>
                            ${prev.data.plan.meals.map((m, idx) => makeMealHtml(m, idx)).join('')}
                            <p style="margin-top:10px"><b>Total Calories:</b> <span id="totalKcal">${prev.data.plan.total_calories}</span> kcal</p>
                        `;
                        // Restore selection
                        prev.selection.forEach((selIdx, idx) => {
                            const radio = output.querySelector(`input[name=\"meal-${idx}\"][value=\"${selIdx}\"]`);
                            if (radio) radio.checked = true;
                        });
                        // Reattach listeners
                        output.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', recompute));
                        const saveBtn3 = document.getElementById('savePlan');
                        const loadBtn3 = document.getElementById('loadPlan');
                        const regen3 = document.getElementById('regen');
                        if (saveBtn3) saveBtn3.onclick = saveBtn.onclick;
                        if (loadBtn3) loadBtn3.onclick = loadBtn.onclick;
                        if (regen3) regen3.onclick = regen.onclick;
                        previousPlanSnapshot = null;
                    };
                } catch (err) {
                    alert('Could not regenerate.');
                } finally {
                    regen.disabled = false; regen.textContent = '🔄 Regenerate Alternatives';
                }
            };
        } catch (error) {
            console.error("⚠️ Fetch failed:", error);
            output.innerHTML = `<p style='color:red;'>⚠️ Could not connect to backend.<br>${error}</p>`;
        }
    });
});


