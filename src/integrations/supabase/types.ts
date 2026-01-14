export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_grader_decisions: {
        Row: {
          ai_prediction_id: string
          ai_suggested_grade: string | null
          color_ai_value: string | null
          color_decision: string
          color_final_value: string | null
          company_id: string
          created_at: string
          decision_time_seconds: number | null
          defects_ai_value: number | null
          defects_decision: string
          defects_final_value: number | null
          final_grade: string
          grader_id: string
          grading_id: string
          id: string
          leaf_position_ai_value: string | null
          leaf_position_decision: string
          leaf_position_final_value: string | null
          maturity_ai_value: string | null
          maturity_decision: string
          maturity_final_value: string | null
          modification_reason: string | null
          notes: string | null
          overall_decision: string
          texture_ai_value: string | null
          texture_decision: string
          texture_final_value: string | null
        }
        Insert: {
          ai_prediction_id: string
          ai_suggested_grade?: string | null
          color_ai_value?: string | null
          color_decision?: string
          color_final_value?: string | null
          company_id: string
          created_at?: string
          decision_time_seconds?: number | null
          defects_ai_value?: number | null
          defects_decision?: string
          defects_final_value?: number | null
          final_grade: string
          grader_id: string
          grading_id: string
          id?: string
          leaf_position_ai_value?: string | null
          leaf_position_decision?: string
          leaf_position_final_value?: string | null
          maturity_ai_value?: string | null
          maturity_decision?: string
          maturity_final_value?: string | null
          modification_reason?: string | null
          notes?: string | null
          overall_decision?: string
          texture_ai_value?: string | null
          texture_decision?: string
          texture_final_value?: string | null
        }
        Update: {
          ai_prediction_id?: string
          ai_suggested_grade?: string | null
          color_ai_value?: string | null
          color_decision?: string
          color_final_value?: string | null
          company_id?: string
          created_at?: string
          decision_time_seconds?: number | null
          defects_ai_value?: number | null
          defects_decision?: string
          defects_final_value?: number | null
          final_grade?: string
          grader_id?: string
          grading_id?: string
          id?: string
          leaf_position_ai_value?: string | null
          leaf_position_decision?: string
          leaf_position_final_value?: string | null
          maturity_ai_value?: string | null
          maturity_decision?: string
          maturity_final_value?: string | null
          modification_reason?: string | null
          notes?: string | null
          overall_decision?: string
          texture_ai_value?: string | null
          texture_decision?: string
          texture_final_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_grader_decisions_ai_prediction_id_fkey"
            columns: ["ai_prediction_id"]
            isOneToOne: false
            referencedRelation: "ai_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_grader_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_grader_decisions_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          model_type: string
          name: string
          provider: string
          updated_at: string
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          model_type?: string
          name: string
          provider?: string
          updated_at?: string
          version: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          model_type?: string
          name?: string
          provider?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          ai_model_id: string | null
          company_id: string
          created_at: string
          defect_confidence: number | null
          defect_percentage: number | null
          detected_defects: Json | null
          error_message: string | null
          explanation: string | null
          grading_id: string | null
          grading_image_id: string | null
          id: string
          key_factors: Json | null
          overall_confidence: number | null
          overlay_data: Json | null
          processing_time_ms: number | null
          raw_response: Json | null
          shape_consistency_score: number | null
          size_variation_score: number | null
          suggested_color: string | null
          suggested_color_confidence: number | null
          suggested_grade: string | null
          suggested_grade_class: string | null
          suggested_leaf_position: string | null
          suggested_leaf_position_confidence: number | null
          suggested_maturity: string | null
          suggested_maturity_confidence: number | null
          suggested_texture: string | null
          suggested_texture_confidence: number | null
          uniformity_score: number | null
        }
        Insert: {
          ai_model_id?: string | null
          company_id: string
          created_at?: string
          defect_confidence?: number | null
          defect_percentage?: number | null
          detected_defects?: Json | null
          error_message?: string | null
          explanation?: string | null
          grading_id?: string | null
          grading_image_id?: string | null
          id?: string
          key_factors?: Json | null
          overall_confidence?: number | null
          overlay_data?: Json | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          shape_consistency_score?: number | null
          size_variation_score?: number | null
          suggested_color?: string | null
          suggested_color_confidence?: number | null
          suggested_grade?: string | null
          suggested_grade_class?: string | null
          suggested_leaf_position?: string | null
          suggested_leaf_position_confidence?: number | null
          suggested_maturity?: string | null
          suggested_maturity_confidence?: number | null
          suggested_texture?: string | null
          suggested_texture_confidence?: number | null
          uniformity_score?: number | null
        }
        Update: {
          ai_model_id?: string | null
          company_id?: string
          created_at?: string
          defect_confidence?: number | null
          defect_percentage?: number | null
          detected_defects?: Json | null
          error_message?: string | null
          explanation?: string | null
          grading_id?: string | null
          grading_image_id?: string | null
          id?: string
          key_factors?: Json | null
          overall_confidence?: number | null
          overlay_data?: Json | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          shape_consistency_score?: number | null
          size_variation_score?: number | null
          suggested_color?: string | null
          suggested_color_confidence?: number | null
          suggested_grade?: string | null
          suggested_grade_class?: string | null
          suggested_leaf_position?: string | null
          suggested_leaf_position_confidence?: number | null
          suggested_maturity?: string | null
          suggested_maturity_confidence?: number | null
          suggested_texture?: string | null
          suggested_texture_confidence?: number | null
          uniformity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_ai_model_id_fkey"
            columns: ["ai_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_predictions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_predictions_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_predictions_grading_image_id_fkey"
            columns: ["grading_image_id"]
            isOneToOne: false
            referencedRelation: "grading_images"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          device_fingerprint: string | null
          device_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bales: {
        Row: {
          bale_code: string
          batch_number: string | null
          company_id: string
          created_at: string
          device_id: string | null
          farmer_id: string
          id: string
          lot_number: string | null
          qr_code: string | null
          registered_at: string
          registered_by: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["bale_status"] | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          synced_at: string | null
          updated_at: string
          warehouse_id: string
          weight_kg: number
        }
        Insert: {
          bale_code: string
          batch_number?: string | null
          company_id: string
          created_at?: string
          device_id?: string | null
          farmer_id: string
          id?: string
          lot_number?: string | null
          qr_code?: string | null
          registered_at?: string
          registered_by?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["bale_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          updated_at?: string
          warehouse_id: string
          weight_kg: number
        }
        Update: {
          bale_code?: string
          batch_number?: string | null
          company_id?: string
          created_at?: string
          device_id?: string | null
          farmer_id?: string
          id?: string
          lot_number?: string | null
          qr_code?: string | null
          registered_at?: string
          registered_by?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["bale_status"] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          updated_at?: string
          warehouse_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "bales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bales_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bales_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          license_expires_at: string | null
          license_type: string | null
          logo_url: string | null
          max_graders: number | null
          max_warehouses: number | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_expires_at?: string | null
          license_type?: string | null
          logo_url?: string | null
          max_graders?: number | null
          max_warehouses?: number | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          license_expires_at?: string | null
          license_type?: string | null
          logo_url?: string | null
          max_graders?: number | null
          max_warehouses?: number | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          company_id: string
          created_at: string
          device_id: string
          device_name: string | null
          device_type: string | null
          fingerprint: string | null
          id: string
          is_trusted: boolean | null
          last_sync_at: string | null
          trusted_at: string | null
          trusted_by: string | null
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          device_id: string
          device_name?: string | null
          device_type?: string | null
          fingerprint?: string | null
          id?: string
          is_trusted?: boolean | null
          last_sync_at?: string | null
          trusted_at?: string | null
          trusted_by?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          fingerprint?: string | null
          id?: string
          is_trusted?: boolean | null
          last_sync_at?: string | null
          trusted_at?: string | null
          trusted_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          company_id: string
          created_at: string
          evidence_urls: string[] | null
          grading_id: string
          id: string
          new_grade_code: string | null
          priority: string | null
          raised_at: string
          raised_by: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          evidence_urls?: string[] | null
          grading_id: string
          id?: string
          new_grade_code?: string | null
          priority?: string | null
          raised_at?: string
          raised_by: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          evidence_urls?: string[] | null
          grading_id?: string
          id?: string
          new_grade_code?: string | null
          priority?: string | null
          raised_at?: string
          raised_by?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          bank_account: string | null
          company_id: string
          contract_end_date: string | null
          contract_number: string | null
          contract_start_date: string | null
          created_at: string
          email: string | null
          farm_location: string | null
          farmer_code: string
          full_name: string
          gps_coordinates: unknown
          id: string
          is_active: boolean | null
          mobile_money_number: string | null
          national_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          company_id: string
          contract_end_date?: string | null
          contract_number?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          farm_location?: string | null
          farmer_code: string
          full_name: string
          gps_coordinates?: unknown
          id?: string
          is_active?: boolean | null
          mobile_money_number?: string | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          company_id?: string
          contract_end_date?: string | null
          contract_number?: string | null
          contract_start_date?: string | null
          created_at?: string
          email?: string | null
          farm_location?: string | null
          farmer_code?: string
          full_name?: string
          gps_coordinates?: unknown
          id?: string
          is_active?: boolean | null
          mobile_money_number?: string | null
          national_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_alerts: {
        Row: {
          affected_farmers: Json | null
          affected_gradings: Json | null
          alert_type: string
          company_id: string
          created_at: string
          description: string
          evidence: Json | null
          grader_id: string | null
          id: string
          investigated_at: string | null
          investigated_by: string | null
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_farmers?: Json | null
          affected_gradings?: Json | null
          alert_type: string
          company_id: string
          created_at?: string
          description: string
          evidence?: Json | null
          grader_id?: string | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_farmers?: Json | null
          affected_gradings?: Json | null
          alert_type?: string
          company_id?: string
          created_at?: string
          description?: string
          evidence?: Json | null
          grader_id?: string | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      grader_analytics: {
        Row: {
          ai_accept_rate: number | null
          ai_modify_rate: number | null
          ai_reject_rate: number | null
          avg_deviation_from_ai: number | null
          company_id: string
          consistency_score: number | null
          created_at: string
          deviation_trend: string | null
          grade_distribution: Json | null
          grader_id: string
          harshness_percentile: number | null
          harshness_score: number | null
          id: string
          pattern_anomalies: Json | null
          period_end: string
          period_start: string
          requires_review: boolean | null
          risk_factors: Json | null
          risk_score: number | null
          total_gradings: number
          total_with_ai_assist: number
          updated_at: string
        }
        Insert: {
          ai_accept_rate?: number | null
          ai_modify_rate?: number | null
          ai_reject_rate?: number | null
          avg_deviation_from_ai?: number | null
          company_id: string
          consistency_score?: number | null
          created_at?: string
          deviation_trend?: string | null
          grade_distribution?: Json | null
          grader_id: string
          harshness_percentile?: number | null
          harshness_score?: number | null
          id?: string
          pattern_anomalies?: Json | null
          period_end: string
          period_start: string
          requires_review?: boolean | null
          risk_factors?: Json | null
          risk_score?: number | null
          total_gradings?: number
          total_with_ai_assist?: number
          updated_at?: string
        }
        Update: {
          ai_accept_rate?: number | null
          ai_modify_rate?: number | null
          ai_reject_rate?: number | null
          avg_deviation_from_ai?: number | null
          company_id?: string
          consistency_score?: number | null
          created_at?: string
          deviation_trend?: string | null
          grade_distribution?: Json | null
          grader_id?: string
          harshness_percentile?: number | null
          harshness_score?: number | null
          id?: string
          pattern_anomalies?: Json | null
          period_end?: string
          period_start?: string
          requires_review?: boolean | null
          risk_factors?: Json | null
          risk_score?: number | null
          total_gradings?: number
          total_with_ai_assist?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grader_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_images: {
        Row: {
          bale_id: string | null
          capture_metadata: Json | null
          captured_at: string
          company_id: string
          created_at: string
          device_id: string | null
          grader_id: string | null
          grading_id: string | null
          id: string
          image_type: string
          image_url: string
          thumbnail_url: string | null
        }
        Insert: {
          bale_id?: string | null
          capture_metadata?: Json | null
          captured_at?: string
          company_id: string
          created_at?: string
          device_id?: string | null
          grader_id?: string | null
          grading_id?: string | null
          id?: string
          image_type?: string
          image_url: string
          thumbnail_url?: string | null
        }
        Update: {
          bale_id?: string | null
          capture_metadata?: Json | null
          captured_at?: string
          company_id?: string
          created_at?: string
          device_id?: string | null
          grader_id?: string | null
          grading_id?: string | null
          id?: string
          image_type?: string
          image_url?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grading_images_bale_id_fkey"
            columns: ["bale_id"]
            isOneToOne: false
            referencedRelation: "bales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_images_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_images_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_prices: {
        Row: {
          calculated_at: string
          currency: string | null
          grading_id: string
          id: string
          price_matrix_id: string | null
          total_value: number
          unit_price: number
        }
        Insert: {
          calculated_at?: string
          currency?: string | null
          grading_id: string
          id?: string
          price_matrix_id?: string | null
          total_value: number
          unit_price: number
        }
        Update: {
          calculated_at?: string
          currency?: string | null
          grading_id?: string
          id?: string
          price_matrix_id?: string | null
          total_value?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_prices_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_prices_price_matrix_id_fkey"
            columns: ["price_matrix_id"]
            isOneToOne: false
            referencedRelation: "price_matrices"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_rules: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          published_at: string | null
          published_by: string | null
          rules: Json
          season_id: string | null
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          published_at?: string | null
          published_by?: string | null
          rules: Json
          season_id?: string | null
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          published_at?: string | null
          published_by?: string | null
          rules?: Json
          season_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "grading_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_rules_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      gradings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bale_id: string
          color: string
          company_id: string
          confidence_score: number | null
          created_at: string
          defect_percent: number | null
          device_fingerprint: string | null
          device_id: string | null
          grade_class: string | null
          grade_code: string
          graded_at: string
          graded_offline: boolean | null
          grader_id: string
          grading_rule_id: string | null
          id: string
          is_locked: boolean | null
          leaf_position: string
          locked_at: string | null
          locked_by: string | null
          maturity: string
          moisture_percent: number | null
          notes: string | null
          photo_urls: string[] | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          synced_at: string | null
          texture: string
          uniformity_score: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bale_id: string
          color: string
          company_id: string
          confidence_score?: number | null
          created_at?: string
          defect_percent?: number | null
          device_fingerprint?: string | null
          device_id?: string | null
          grade_class?: string | null
          grade_code: string
          graded_at?: string
          graded_offline?: boolean | null
          grader_id: string
          grading_rule_id?: string | null
          id?: string
          is_locked?: boolean | null
          leaf_position: string
          locked_at?: string | null
          locked_by?: string | null
          maturity: string
          moisture_percent?: number | null
          notes?: string | null
          photo_urls?: string[] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          texture: string
          uniformity_score?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bale_id?: string
          color?: string
          company_id?: string
          confidence_score?: number | null
          created_at?: string
          defect_percent?: number | null
          device_fingerprint?: string | null
          device_id?: string | null
          grade_class?: string | null
          grade_code?: string
          graded_at?: string
          graded_offline?: boolean | null
          grader_id?: string
          grading_rule_id?: string | null
          id?: string
          is_locked?: boolean | null
          leaf_position?: string
          locked_at?: string | null
          locked_by?: string | null
          maturity?: string
          moisture_percent?: number | null
          notes?: string | null
          photo_urls?: string[] | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          texture?: string
          uniformity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gradings_bale_id_fkey"
            columns: ["bale_id"]
            isOneToOne: false
            referencedRelation: "bales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_grading_rule_id_fkey"
            columns: ["grading_rule_id"]
            isOneToOne: false
            referencedRelation: "grading_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      license_usage: {
        Row: {
          company_id: string
          id: string
          metric_type: string
          metric_value: number
          recorded_at: string
          season_id: string | null
        }
        Insert: {
          company_id: string
          id?: string
          metric_type: string
          metric_value: number
          recorded_at?: string
          season_id?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_usage_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          company_id: string
          created_at: string
          currency: string | null
          farmer_id: string
          id: string
          paid_at: string | null
          payment_reference: string | null
          season_id: string | null
          status: string | null
          total_value: number | null
          total_weight_kg: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          currency?: string | null
          farmer_id: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          season_id?: string | null
          status?: string | null
          total_value?: number | null
          total_weight_kg?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          currency?: string | null
          farmer_id?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          season_id?: string | null
          status?: string | null
          total_value?: number | null
          total_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      price_matrices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean | null
          name: string
          prices: Json
          published_at: string | null
          published_by: string | null
          season_id: string | null
          version: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prices: Json
          published_at?: string | null
          published_by?: string | null
          season_id?: string | null
          version?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prices?: Json
          published_at?: string | null
          published_by?: string | null
          season_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_matrices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_matrices_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          device_fingerprint: string | null
          device_id: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_id?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          device_fingerprint?: string | null
          device_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          code: string
          company_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          start_date: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          start_date: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue: {
        Row: {
          company_id: string
          created_at: string
          device_id: string
          entity_id: string
          entity_type: string
          id: string
          last_error: string | null
          operation: string
          payload: Json
          priority: number | null
          processed_at: string | null
          retry_count: number | null
          status: Database["public"]["Enums"]["sync_status"] | null
        }
        Insert: {
          company_id: string
          created_at?: string
          device_id: string
          entity_id: string
          entity_type: string
          id?: string
          last_error?: string | null
          operation: string
          payload: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Update: {
          company_id?: string
          created_at?: string
          device_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_error?: string | null
          operation?: string
          payload?: Json
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
          status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          warehouse_id: string | null
        }
        Insert: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          code: string
          company_id: string
          created_at: string
          gps_coordinates: unknown
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          gps_coordinates?: unknown
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          gps_coordinates?: unknown
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "company_admin"
        | "grader"
        | "quality_supervisor"
        | "farmer"
        | "auditor"
      bale_status:
        | "registered"
        | "pending_grading"
        | "graded"
        | "disputed"
        | "approved"
        | "paid"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved"
        | "escalated"
        | "closed"
      sync_status: "pending" | "syncing" | "synced" | "conflict" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "company_admin",
        "grader",
        "quality_supervisor",
        "farmer",
        "auditor",
      ],
      bale_status: [
        "registered",
        "pending_grading",
        "graded",
        "disputed",
        "approved",
        "paid",
      ],
      dispute_status: [
        "open",
        "under_review",
        "resolved",
        "escalated",
        "closed",
      ],
      sync_status: ["pending", "syncing", "synced", "conflict", "failed"],
    },
  },
} as const
