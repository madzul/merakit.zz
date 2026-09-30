import { createClient } from "@/lib/supabase/server";
import type { Material, MaterialMovement, MaterialMovementType, ProductMaterial } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

function mapMaterial(row: Tables<"materials">): Material {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    stock: Number(row.stock),
    minStock: Number(row.min_stock),
    unitCost: Number(row.unit_cost),
    notes: row.notes ?? "",
    isActive: row.is_active,
  };
}

type MovementRow = Tables<"material_movements"> & { materials: { name: string } | null };

function mapMovement(row: MovementRow): MaterialMovement {
  return {
    id: row.id,
    materialId: row.material_id,
    materialName: row.materials?.name ?? "-",
    type: row.type,
    quantity: Number(row.quantity),
    unitCost: row.unit_cost === null ? null : Number(row.unit_cost),
    date: row.movement_date,
    productionRecordId: row.production_record_id,
    expenseId: row.expense_id,
    notes: row.notes ?? "",
  };
}

export interface MaterialInput {
  name: string;
  unit: string;
  minStock: number;
  unitCost: number;
  notes: string;
  isActive: boolean;
}

export interface MovementInput {
  materialId: string;
  type: MaterialMovementType;
  quantity: number;
  unitCost: number | null;
  date: string;
  notes: string;
  expenseId: string | null;
}

// ---------- materials ----------

export async function getMaterials(): Promise<Material[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("materials").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapMaterial);
}

export async function getMaterialById(id: string): Promise<Material | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("materials").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapMaterial(data) : null;
}

/** Stok awal (bila > 0) dicatat sebagai pergerakan "penyesuaian" agar riwayatnya lengkap. */
export async function createMaterial(input: MaterialInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .insert({
      name: input.name,
      unit: input.unit,
      min_stock: input.minStock,
      unit_cost: input.unitCost,
      notes: input.notes || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateMaterial(id: string, input: MaterialInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({
      name: input.name,
      unit: input.unit,
      min_stock: input.minStock,
      unit_cost: input.unitCost,
      notes: input.notes || null,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMaterial(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
}

export async function countMaterialUsage(id: string): Promise<{ movements: number; recipes: number }> {
  const supabase = await createClient();
  const [movements, recipes] = await Promise.all([
    supabase.from("material_movements").select("id", { count: "exact", head: true }).eq("material_id", id),
    supabase.from("product_materials").select("product_id", { count: "exact", head: true }).eq("material_id", id),
  ]);
  if (movements.error) throw movements.error;
  if (recipes.error) throw recipes.error;
  return { movements: movements.count ?? 0, recipes: recipes.count ?? 0 };
}

// ---------- material_movements ----------

export async function getMovements(options: { materialId?: string; limit?: number } = {}): Promise<MaterialMovement[]> {
  const supabase = await createClient();
  let query = supabase
    .from("material_movements")
    .select("*, materials(name)")
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 200);
  if (options.materialId) query = query.eq("material_id", options.materialId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapMovement(row as MovementRow));
}

export async function getMovementById(id: string): Promise<MaterialMovement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("material_movements").select("*, materials(name)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapMovement(data as MovementRow) : null;
}

/** Hanya pergerakan manual — RLS menolak baris yang punya production_record_id. */
export async function createMovement(input: MovementInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("material_movements").insert({
    material_id: input.materialId,
    type: input.type,
    quantity: input.quantity,
    unit_cost: input.unitCost,
    movement_date: input.date,
    notes: input.notes || null,
    expense_id: input.expenseId,
    created_by: user?.id ?? null,
  });
  if (error) throw error;
}

export async function deleteMovement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("material_movements").delete().eq("id", id);
  if (error) throw error;
}

// ---------- product_materials (resep) ----------

type RecipeRow = Tables<"product_materials"> & {
  materials: { name: string; unit: string; unit_cost: number } | null;
};

export async function getProductRecipe(productId: string): Promise<ProductMaterial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_materials")
    .select("*, materials(name, unit, unit_cost)")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? [])
    .map((raw) => {
      const row = raw as RecipeRow;
      return {
        productId: row.product_id,
        materialId: row.material_id,
        materialName: row.materials?.name ?? "-",
        unit: row.materials?.unit ?? "",
        quantityPerUnit: Number(row.quantity_per_unit),
        unitCost: Number(row.materials?.unit_cost ?? 0),
      };
    })
    .sort((a, b) => a.materialName.localeCompare(b.materialName));
}

/** Ganti seluruh resep produk (hapus lalu isi ulang). */
export async function replaceProductRecipe(
  productId: string,
  rows: { materialId: string; quantityPerUnit: number }[]
): Promise<void> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase.from("product_materials").delete().eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (rows.length === 0) return;
  const { error } = await supabase.from("product_materials").insert(
    rows.map((row) => ({ product_id: productId, material_id: row.materialId, quantity_per_unit: row.quantityPerUnit }))
  );
  if (error) throw error;
}
